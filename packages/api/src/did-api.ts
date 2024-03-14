import type { DidCreateParams, DidMessageResult, DidResolveParams, ResponseStatus, Web5Agent } from '@web5/agent';

import { DidInterface } from '@web5/agent';

export type DidCreateRequest = Pick<DidCreateParams, 'method' | 'options' | 'store'>;

export type DidCreateResponse = ResponseStatus & {
  did?: DidMessageResult[DidInterface.Create];
};

export type DidResolveResponse = DidMessageResult[DidInterface.Resolve];

/**
 * The DID API is used to resolve DIDs.
 *
 * @beta
 */
export class DidApi {
  /**
   * Holds the instance of a {@link Web5Agent} that represents the current execution context for
   * the `DidApi`. This agent is used to process DID requests.
   */
  private agent: Web5Agent;

  /** The DID of the tenant under which DID operations are being performed. */
  private connectedDid: string;

  constructor(options: { agent: Web5Agent, connectedDid: string }) {
    this.agent = options.agent;
    this.connectedDid = options.connectedDid;
  }

  public async create(request: DidCreateRequest): Promise<DidCreateResponse> {
    const { result, ...status } = await this.agent.processDidRequest({
      messageType   : DidInterface.Create,
      messageParams : { ...request }
    });

    return { did: result, ...status };
  }

  /**
   * Resolves a DID to a DID Resolution Result.
   *
   * @param didUri - The DID or DID URL to resolve.
   * @returns A promise that resolves to the DID Resolution Result.
   */
  public async resolve(
    didUri: DidResolveParams['didUri'], options?: DidResolveParams['options']
  ): Promise<DidResolveResponse> {
    const { result: didResolutionResult } = await this.agent.processDidRequest({
      messageParams : { didUri, options },
      messageType   : DidInterface.Resolve
    });

    return didResolutionResult;
  }
}