import type { DwnServiceEndpoint } from '@tbd54566975/dids';
import type {
  SignatureInput,
  MessagesGetReply,
  RecordsReadReply,
  RecordsWriteMessage,
  RecordsWriteOptions,
  PrivateJwk as DwnPrivateKeyJwk,
} from '@tbd54566975/dwn-sdk-js';

import { Readable } from 'readable-stream';
import { DidResolver, DidIonApi, DidKeyApi, utils as didUtils } from '@tbd54566975/dids';
import {
  Cid,
  Dwn,
  Encoder,
  Message,
  EventsGet,
  DataStream,
  RecordsRead,
  MessagesGet,
  RecordsWrite,
  RecordsQuery,
  RecordsDelete,
  DwnMethodName,
  ProtocolsQuery,
  DwnInterfaceName,
  ProtocolsConfigure,
} from '@tbd54566975/dwn-sdk-js';
import {
  DwnRpc,
  Web5Agent,
  DwnResponse,
  DwnRpcRequest,
  SendDwnRequest,
  ProcessDwnRequest,
} from '@tbd54566975/web5-agent';

import type { ProfileManager } from './profile-manager.js';

import { ProfileApi } from './profile-api.js';
import { DwnRpcClient } from './dwn-rpc-client.js';
import {
  encryptStream,
  teeNodeReadable,
  generateDwnEncryptionInput,
  blobToIsomorphicNodeReadable,
  webReadableToIsomorphicNodeReadable,
} from './utils.js';

// TODO: allow user to provide optional array of DwnRpc implementations once DwnRpc has been moved out of this package
export type Web5UserAgentOptions = {
  didResolver: DidResolver;
  dwn: Dwn;
  profileManager: ProfileManager;
};

type DwnMessage = {
  message: any;
  data?: Blob;
}

const dwnMessageCreators = {
  [DwnInterfaceName.Events + DwnMethodName.Get]          : EventsGet,
  [DwnInterfaceName.Messages + DwnMethodName.Get]        : MessagesGet,
  [DwnInterfaceName.Records + DwnMethodName.Read]        : RecordsRead,
  [DwnInterfaceName.Records + DwnMethodName.Query]       : RecordsQuery,
  [DwnInterfaceName.Records + DwnMethodName.Write]       : RecordsWrite,
  [DwnInterfaceName.Records + DwnMethodName.Delete]      : RecordsDelete,
  [DwnInterfaceName.Protocols + DwnMethodName.Query]     : ProtocolsQuery,
  [DwnInterfaceName.Protocols + DwnMethodName.Configure] : ProtocolsConfigure,
};

export class Web5UserAgent implements Web5Agent {
  private dwn: Dwn;
  private profileManager: ProfileManager;
  private didResolver: DidResolver;
  private dwnRpcClient: DwnRpc;

  constructor(options: Web5UserAgentOptions) {
    this.dwn = options.dwn;
    this.didResolver = options.didResolver;
    this.profileManager = options.profileManager;

    this.dwnRpcClient = new DwnRpcClient();
  }

  /**
   * TODO: add jsdoc
   * @param options
   * @returns
   */
  static async create(options: Partial<Web5UserAgentOptions>) {
    options.dwn ||= await Dwn.create();
    options.profileManager ||= new ProfileApi();
    options.didResolver ||= new DidResolver({ methodResolvers: [new DidIonApi(), new DidKeyApi()] });

    return new Web5UserAgent(options as Web5UserAgentOptions);
  }

  /**
   * TODO: add jsdoc
   * @param message
   * @returns
   */
  async processDwnRequest(request: ProcessDwnRequest): Promise<DwnResponse> {
    const { message, dataStream } = await this.#constructDwnMessage(request);
    const reply = await this.dwn.processMessage(request.target, message, dataStream as any);

    return {
      reply,
      message    : message,
      messageCid : await Message.getCid(message)
    };
  }

  async sendDwnRequest(request: SendDwnRequest): Promise<DwnResponse> {
    const dwnRpcRequest: Partial<DwnRpcRequest> = { targetDid: request.target };
    let messageData;

    if ('messageCid' in request) {
      const { message, data } =  await this.#getDwnMessage(request.author, request.messageType, request.messageCid);

      dwnRpcRequest.message = message;
      messageData = data;
    } else {
      const { message } = await this.#constructDwnMessage(request);
      dwnRpcRequest.message = message;
      messageData = request.dataStream;
    }

    if (messageData) {
      dwnRpcRequest.data = messageData;
    }

    const didResolution = await this.didResolver.resolve(request.target);
    if (!didResolution.didDocument) {
      if (didResolution.didResolutionMetadata?.error) {
        throw new Error(`DID resolution error: ${didResolution.didResolutionMetadata.error}`);
      } else {
        throw new Error('DID resolution error: figure out error message');
      }
    }

    const [ service ] = didUtils.getServices(didResolution.didDocument, { id: '#dwn' });
    if (!service) {
      throw new Error(`${request.target} has no '#dwn' service endpoints`);
    }

    const { serviceEndpoint } = service;
    if (!serviceEndpoint['nodes']) {
      throw new Error(`malformed '#dwn' service endpoint. expected nodes array`);
    }

    const { nodes } = serviceEndpoint as DwnServiceEndpoint;
    let dwnReply;
    let errorMessages = [];

    // try sending to author's publicly addressable dwn's until first request succeeds.
    for (let node of nodes) {
      dwnRpcRequest.dwnUrl = node;

      try {
        dwnReply = await this.dwnRpcClient.sendDwnRequest(dwnRpcRequest as DwnRpcRequest);
        break;
      } catch(e) {
        errorMessages.push({ url: node, message: e.message });
      }
    }

    if (!dwnReply) {
      throw new Error(JSON.stringify(errorMessages));
    }

    return {
      message    : dwnRpcRequest.message,
      messageCid : await Message.getCid(dwnRpcRequest.message),
      reply      : dwnReply,
    };
  }

  async #getDwnMessage(author: string, messageType: string, messageCid: string): Promise<DwnMessage> {
    const dwnSignatureInput = await this.#getAuthorSignatureInput(author);
    const messagesGet = await MessagesGet.create({
      authorizationSignatureInput : dwnSignatureInput,
      messageCids                 : [messageCid]
    });

    const result: MessagesGetReply = await this.dwn.processMessage(author, messagesGet.toJSON());
    const [ messageEntry ] = result.messages;

    if (!messageEntry) {
      throw new Error('TODO: figure out error message');
    }

    let { message } = messageEntry;
    if (!message) {
      throw new Error('TODO: message not found');
    }

    let dwnMessage: DwnMessage = { message };

    // if the message is a RecordsWrite, either data will be present, OR we have to fetch it using a RecordsRead
    if (messageType === 'RecordsWrite') {
      const { encodedData } = messageEntry;
      message = message as RecordsWriteMessage;

      if (encodedData) {
        const dataBytes = Encoder.base64UrlToBytes(encodedData);
        dwnMessage.data = new Blob([dataBytes]);
      } else {
        const recordsRead = await RecordsRead.create({
          authorizationSignatureInput : dwnSignatureInput,
          recordId                    : message['recordId']
        });

        const reply = await this.dwn.processMessage(author, recordsRead.toJSON()) as RecordsReadReply;

        if (reply.status.code >= 400) {
          const { status: { code, detail } } = reply;
          throw new Error(`(${code}) Failed to read data associated with record ${message['recordId']}. ${detail}}`);
        } else {
          const dataBytes = await DataStream.toBytes(reply.record.data);
          dwnMessage.data = new Blob([dataBytes]);
        }
      }
    }

    return dwnMessage;
  }

  async #constructDwnMessage(request: ProcessDwnRequest) {
    // TODO: Reconsider use of Node Readable for the DWN SDK and evaluate refactor to use Web ReadableStream.

    const dwnSignatureInput = await this.#getAuthorSignatureInput(request.author);
    let streamForProcessMessage: Readable;

    // TODO: Consider refactoring to move data transformations imposed by fetch() limitations to the HTTP transport-related methods.
    if (request.messageType === 'RecordsWrite') {
      const messageOptions = request.messageOptions as RecordsWriteOptions;

      if (request.encrypt) {
        const encryptionSubject = request.encrypt === true ? request.author : request.encrypt?.for;
        if (!encryptionSubject) {
          throw new Error('record encryption enabled but DID to encrypt for not provided.');
        }

        const { didDocument } = await this.didResolver.resolve(encryptionSubject);

        // Retrieve `#dwn` service entry.
        const [ dwnService ] = didUtils.getServices(didDocument, { id: '#dwn' });
        if (dwnService === undefined || typeof dwnService?.serviceEndpoint !== 'object' ) {
          throw new Error(`${encryptionSubject} has no '#dwn' service endpoint defined in DID document`);
        }

        // Retrieve first record encryption key from the #dwn serviceEndpoint.
        if (!dwnService.serviceEndpoint.recordEncryptionKeys) {
          throw new Error(`${encryptionSubject} has no 'recordEncryptionKeys' defined in '#dwn' service endpoint of DID document`);
        }
        const [ encryptionPublicKeyId ] = dwnService.serviceEndpoint.recordEncryptionKeys;

        const [ verificationMethod ] = didUtils.findVerificationMethods(didDocument, { id: encryptionPublicKeyId }) || [];
        if (!verificationMethod) {
          throw new Error(`${encryptionSubject} has no '${encryptionPublicKeyId}' verification method defined in DID document`);
        }

        const encryptionInputOptions = {
          schema   : messageOptions.schema,
          protocol : messageOptions.protocol
        };

        const encryptionSubjectPublicKeyJwk = verificationMethod.publicKeyJwk;
        messageOptions.encryptionInput = generateDwnEncryptionInput(encryptionSubjectPublicKeyJwk, encryptionInputOptions);
      }

      if (request.dataStream && !messageOptions.data) {
        let nodeReadableStream: Readable;
        let { dataStream } = request;
        let streamForCidComputation: Readable;

        if (dataStream instanceof Blob) {
          nodeReadableStream = blobToIsomorphicNodeReadable(dataStream);

        } else if (dataStream instanceof ReadableStream) {
          nodeReadableStream = webReadableToIsomorphicNodeReadable(dataStream);
        }

        // If encryption was specified, encrypt the data stream before proceeding.
        if (messageOptions.encryptionInput) {
          nodeReadableStream = await encryptStream(messageOptions.encryptionInput, nodeReadableStream);
        }

        ([ streamForCidComputation, streamForProcessMessage ] = teeNodeReadable(nodeReadableStream));

        // Count the stream bytes while the CID is being computed.
        let bytesRead = 0;
        streamForCidComputation.on('data', (chunk) => {
          bytesRead += chunk.length;
        });

        messageOptions.dataCid = await Cid.computeDagPbCidFromStream(streamForCidComputation);
        messageOptions.dataSize ??= bytesRead;
      }
    }

    // TODO: Figure out how to narrow this type. may have figured something out in `web5.DidInterface`
    const messageCreateInput = {
      ...<any>request.messageOptions,
      authorizationSignatureInput: dwnSignatureInput
    };

    const messageCreator = dwnMessageCreators[request.messageType];
    const dwnMessage = await messageCreator.create(messageCreateInput as any);

    return { message: dwnMessage.toJSON(), dataStream: streamForProcessMessage };
  }

  /**
   * constructs signature input required to sign DWeb Messages
   * @param authorDid
   * @returns {SignatureInput}
   */
  async #getAuthorSignatureInput(authorDid: string): Promise<SignatureInput> {
    const profile = await this.profileManager.getProfile(authorDid);

    if (!profile) {
      throw new Error('profile not found for author.');
    }

    const { keys } = profile.did;
    const [ key ] = keys;
    const { privateKeyJwk } = key;

    // TODO: make far less naive
    const kidFragment = privateKeyJwk.kid || key.id;
    const kid = `${profile.did.id}#${kidFragment}`;

    const dwnSignatureInput: SignatureInput = {
      privateJwk      : <DwnPrivateKeyJwk>privateKeyJwk,
      protectedHeader : { alg: privateKeyJwk.crv, kid }
    };

    return dwnSignatureInput;
  }
}