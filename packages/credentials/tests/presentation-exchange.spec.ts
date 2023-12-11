import { expect } from 'chai';
import { DidKeyMethod, PortableDid } from '@web5/dids';

import type { Validated, PresentationDefinitionV2 } from '../src/presentation-exchange.js';

import { VerifiableCredential } from '../src/verifiable-credential.js';
import { PresentationExchange } from '../src/presentation-exchange.js';

class BitcoinCredential {
  constructor(
    public btcAddress: string
  ) {}
}

class OtherCredential {
  constructor(
    public otherthing: string
  ) {}
}

describe('PresentationExchange', () => {
  describe('Full Presentation Exchange', () => {
    let issuerDid: PortableDid;
    let btcCredentialJwt: string;
    let presentationDefinition: PresentationDefinitionV2;

    before(async () => {
      issuerDid = await DidKeyMethod.create();

      const vc = await VerifiableCredential.create({
        type    : 'StreetCred',
        issuer  : issuerDid.did,
        subject : issuerDid.did,
        data    : new BitcoinCredential('btcAddress123'),
      });

      btcCredentialJwt = await vc.sign({did: issuerDid});
      presentationDefinition = createPresentationDefinition();
    });

    it('should evaluate credentials without any errors or warnings', async () => {
      PresentationExchange.satisfiesPresentationDefinition({
        vcJwts: [btcCredentialJwt],
        presentationDefinition
      });
    });

    it('should return the selected verifiable credentials', () => {
      const actualSelectedVcJwts = PresentationExchange.selectCredentials({
        vcJwts: [btcCredentialJwt],
        presentationDefinition
      });
      expect(actualSelectedVcJwts).to.deep.equal([btcCredentialJwt]);
    });

    it('should return the only one verifiable credential', async () => {
      const vc = await VerifiableCredential.create({
        type    : 'StreetCred',
        issuer  : issuerDid.did,
        subject : issuerDid.did,
        data    : new OtherCredential('otherstuff'),
      });

      const otherCredJwt = await vc.sign({did: issuerDid});

      const actualSelectedVcJwts = PresentationExchange.selectCredentials({
        vcJwts: [btcCredentialJwt, otherCredJwt],
        presentationDefinition
      });
      expect(actualSelectedVcJwts).to.deep.equal([btcCredentialJwt]);
    });

    it('should throw error for a credential that does not satisfy the presentation definition', async () => {
      const otherPresentationDefinition = {
        'id'                : 'test-pd-id',
        'name'              : 'simple PD',
        'purpose'           : 'pd for testing',
        'input_descriptors' : [
          {
            'id'          : 'whatever',
            'purpose'     : 'id for testing',
            'constraints' : {
              'fields': [
                {
                  'path': [
                    '$.credentialSubject.doesNotExist',
                  ]
                }
              ]
            }
          }
        ]
      };

      expect(() =>
        PresentationExchange.satisfiesPresentationDefinition({
          vcJwts                 : [btcCredentialJwt],
          presentationDefinition : otherPresentationDefinition
        })
      ).to.throw('Input candidate does not contain property');
    });

    it('should successfully create a presentation from the given definition and credentials', async () => {
      const presentationResult = PresentationExchange.createPresentationFromCredentials({
        vcJwts: [btcCredentialJwt],
        presentationDefinition
      });
      expect(presentationResult).to.exist;
      expect(presentationResult.presentationSubmission.definition_id).to.equal(presentationDefinition.id);
    });

    it('should throw error for invalid presentation definition', async () => {
      const invalidPresentationDefinition = {
        'id'                : 'test-pd-id',
        'name'              : 'simple PD',
        'purpose'           : 'pd for testing',
        'input_descriptors' : [
          {
            'id'          : 'whatever',
            'purpose'     : 'id for testing',
            'constraints' : {
              'fields': [
                {
                  'path': [
                    'not a valid path',
                  ]
                }
              ]
            }
          }
        ]
      };

      expect(() =>
        PresentationExchange.createPresentationFromCredentials({
          vcJwts                 : [btcCredentialJwt],
          presentationDefinition : invalidPresentationDefinition
        })
      ).to.throw('Failed to pass validation check');
    });

    it('should fail to create a presentation with vc that does not match presentation definition', async () => {
      const vc = await VerifiableCredential.create({
        type    : 'StreetCred',
        issuer  : issuerDid.did,
        subject : issuerDid.did,
        data    : new OtherCredential('otherstuff'),
      });

      const otherCredJwt = await vc.sign({did: issuerDid});

      expect(() =>
        PresentationExchange.createPresentationFromCredentials({
          vcJwts: [otherCredJwt],
          presentationDefinition
        })
      ).to.throw('Failed to create Verifiable Presentation JWT due to: Required Credentials Not Present');
    });

    it('should successfully validate a presentation definition', () => {
      const result:Validated = PresentationExchange.validateDefinition({ presentationDefinition });
      expect(result).to.deep.equal([{ tag: 'root', status: 'info', message: 'ok' }]);
    });

    it('should successfully validate a submission', () => {
      const presentationResult = PresentationExchange.createPresentationFromCredentials({
        vcJwts: [btcCredentialJwt],
        presentationDefinition
      });
      const result = PresentationExchange.validateSubmission(presentationResult.presentationSubmission);
      expect(result).to.deep.equal([{ tag: 'root', status: 'info', message: 'ok' }]);
    });

    it('should evaluate the presentation without any errors or warnings', () => {
      const presentationResult = PresentationExchange.createPresentationFromCredentials({
        vcJwts: [btcCredentialJwt],
        presentationDefinition
      });

      const presentationEvaluationResults = PresentationExchange.evaluatePresentation({
        presentationDefinition,
        presentation: presentationResult.presentation
      });
      expect(presentationEvaluationResults.errors).to.deep.equal([]);
      expect(presentationEvaluationResults.warnings).to.deep.equal([]);

      const result = PresentationExchange.validateSubmission(presentationResult.presentationSubmission);
      expect(result).to.deep.equal([{ tag: 'root', status: 'info', message: 'ok' }]);
    });

    it('should successfully execute the complete presentation exchange flow', () => {
      const presentationResult = PresentationExchange.createPresentationFromCredentials({
        vcJwts: [btcCredentialJwt],
        presentationDefinition
      });

      expect(presentationResult).to.exist;
      expect(presentationResult.presentationSubmission.definition_id).to.equal(presentationDefinition.id);

      const { warnings, errors } = PresentationExchange.evaluatePresentation({
        presentationDefinition,
        presentation: presentationResult.presentation
      });

      expect(errors).to.be.an('array');
      expect(errors?.length).to.equal(0);

      expect(warnings).to.be.an('array');
      expect(warnings?.length).to.equal(0);
    });
  });
});

function createPresentationDefinition(): PresentationDefinitionV2 {
  return {
    'id'                : 'test-pd-id',
    'name'              : 'simple PD',
    'purpose'           : 'pd for testing',
    'input_descriptors' : [
      {
        'id'          : 'whatever',
        'purpose'     : 'id for testing',
        'constraints' : {
          'fields': [
            {
              'path': [
                '$.credentialSubject.btcAddress',
              ]
            }
          ]
        }
      }
    ]
  };
}