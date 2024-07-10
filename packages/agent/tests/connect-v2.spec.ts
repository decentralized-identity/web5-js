import { expect } from 'chai';
import sinon from 'sinon';
import { PlatformAgentTestHarness } from '../src/test-harness.js';
import { TestAgent } from './utils/test-agent.js';
import { testDwnUrl } from './utils/test-config.js';
import type { BearerIdentity } from '../src/bearer-identity.js';
import { ClientWalletConnect } from '../src/connect-v2.js';

let testDwnUrls = [testDwnUrl];

describe('connect-v2', () => {
  let testHarness: PlatformAgentTestHarness;
  let alice: BearerIdentity;

  before(async () => {
    testHarness = await PlatformAgentTestHarness.setup({
      agentClass  : TestAgent,
      agentStores : 'memory',
    });

    await testHarness.createAgentDid();

    alice = await testHarness.agent.identity.create({
      metadata  : { name: 'alice' },
      didMethod : 'dht',
    });
    await testHarness.agent.identity.manage({
      portableIdentity: await alice.export(),
    });
  });

  after(async () => {
    await testHarness.clearStorage();
    await testHarness.closeStorage();
  });

  // const careerIdentity = await testHarness.agent.identity.create({
  //   metadata: { name: "Social" },
  //   didMethod: "jwk",
  // });
  // await testHarness.agent.identity.manage({
  //   portableIdentity: await careerIdentity.export(),
  // });
  // const careerVm = await testHarness.agent.did.getSigningMethod({
  //   didUri: careerIdentity.did.uri,
  // });

  describe('client connect integration tests', () => {
    it('intiaties client wallet connect using a temporary clientDid', async () => {
      const foo = await ClientWalletConnect.init({
        clientDid          : alice.did.uri,
        connectServerUrl   : 'http://localhost:8080/connect',
        permissionRequests : {'12345': { protocolDefinition: {} as any, permissionScopes: {} as any }},
        agent              : testHarness.agent,
        onUriReady         : (uri) => console.log('onUriReady callback called: ', uri),
        pinCapture         : async () => '12345'
      });
    });

    // it("signs the OIDC request using the private key of the clientDid", async () => {});
    // it("encrypts the OIDC request using the code challenge and a nonce", async () => {});
    // it("posts the constructed PAR to the PAR endpoint", async () => {});
  });
});
