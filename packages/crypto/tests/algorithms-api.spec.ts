import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import type { Web5Crypto } from '../src/types/web5-crypto.js';
import type {
  JwkType,
  JwkOperation,
  PublicKeyJwk,
  PrivateKeyJwk,
  JwkParamsEcPublic,
  JwkParamsEcPrivate,
  JwkParamsOkpPublic,
} from '../src/jose.js';

import { Convert } from '@web5/common';
import {
  CryptoKey,
  OperationError,
  CryptoAlgorithm,
  // BaseAesAlgorithm,
  BaseEcdhAlgorithm,
  NotSupportedError,
  // BaseEcdsaAlgorithm,
  // BaseEdDsaAlgorithm,
  InvalidAccessError,
  // BaseAesCtrAlgorithm,
  BasePbkdf2Algorithm,
  BaseEllipticCurveAlgorithm,
} from '../src/algorithms-api/index.js';

chai.use(chaiAsPromised);

describe('Algorithms API', () => {
  describe('CryptoAlgorithm', () => {

    class TestCryptoAlgorithm extends CryptoAlgorithm {
      public name = 'TestAlgorithm';
      public keyOperations: JwkOperation[] = ['decrypt', 'deriveBits', 'deriveKey', 'encrypt', 'sign', 'unwrapKey', 'verify', 'wrapKey'];
      public async decrypt(): Promise<Uint8Array> {
        return null as any;
      }
      public async deriveBits(): Promise<Uint8Array> {
        return null as any;
      }
      public async encrypt(): Promise<Uint8Array> {
        return null as any;
      }
      public async generateKey(): Promise<PrivateKeyJwk> {
        return null as any;
      }
      public async sign(): Promise<Uint8Array> {
        return null as any;
      }
      public async verify(): Promise<boolean> {
        return null as any;
      }
    }

    let alg: TestCryptoAlgorithm;

    beforeEach(() => {
      alg = TestCryptoAlgorithm.create();
    });

    describe('checkAlgorithmName()', () => {
      it('does not throw with matching algorithm name', () => {
        expect(() => alg.checkAlgorithmName({
          algorithmName: 'TestAlgorithm'
        })).to.not.throw();
      });

      it('throws an error if the algorithm name does not match', () => {
        expect(() => alg.checkAlgorithmName({
          algorithmName: 'SomeOtherAlgorithm'
        })).to.throw(NotSupportedError, 'Algorithm not supported');
      });

      it('throws an error if the algorithm name is missing', () => {
        expect(() => alg.checkAlgorithmName({} as any)).to.throw(TypeError, 'Required parameter missing');
      });
    });

    describe('checkCryptoKey()', () => {
      it('does not throw with a valid CryptoKey object', () => {
        const mockCryptoKey = {
          algorithm   : null,
          extractable : null,
          type        : null,
          usages      : null
        };
        expect(() => alg.checkCryptoKey({
          // @ts-expect-error because 'material' property is intentionally omitted to support WebCrypto API CryptoKeys.
          key: mockCryptoKey
        })).to.not.throw();
      });

      it('throws an error if the algorithm name does not match', () => {
        const mockCryptoKey = {
          algorithm : null,
          type      : null,
          usages    : null
        };
        expect(() => alg.checkCryptoKey({
          // @ts-expect-error because 'extractable' property is intentionally ommitted to trigger check to throw.
          key: mockCryptoKey
        })).to.throw(TypeError, 'Object is not a CryptoKey');
      });
    });

    describe('checkKeyAlgorithm()', () => {
      it('throws an error when keyAlgorithmName is undefined', async () => {
        expect(() => alg.checkKeyAlgorithm({} as any)).to.throw(TypeError, 'Required parameter missing');
      });

      it('throws an error when keyAlgorithmName does not match', async () => {
        const wrongName = 'wrongName';
        expect(() => alg.checkKeyAlgorithm({ keyAlgorithmName: wrongName })).to.throw(InvalidAccessError, `Algorithm '${alg.name}' does not match the provided '${wrongName}' key.`);
      });

      it('does not throw an error when keyAlgorithmName matches', async () => {
        const correctName = alg.name;
        expect(() => alg.checkKeyAlgorithm({ keyAlgorithmName: correctName })).not.to.throw();
      });
    });

    describe('checkKeyType()', () => {
      it('throws an error when keyType or allowedKeyType is undefined', async () => {
        expect(() => alg.checkKeyType({} as any)).to.throw(TypeError, 'One or more required parameters missing');
        expect(() => alg.checkKeyType({ keyType: 'public' } as any)).to.throw(TypeError, 'One or more required parameters missing');
        expect(() => alg.checkKeyType({ allowedKeyType: 'public' } as any)).to.throw(TypeError, 'One or more required parameters missing');
      });

      it('throws an error when keyType does not match allowedKeyType', async () => {
        const keyType: JwkType = 'oct';
        const allowedKeyTypes: JwkType[] = ['OKP'];
        expect(() => alg.checkKeyType({ keyType, allowedKeyTypes })).to.throw(InvalidAccessError, 'Key type of the provided key must be');
      });

      it('does not throw an error when keyType matches allowedKeyType', async () => {
        const keyType: JwkType = 'EC';
        const allowedKeyTypes: JwkType[] = ['EC'];
        expect(() => alg.checkKeyType({ keyType, allowedKeyTypes })).not.to.throw();
      });
    });

    describe('checkKeyOperations()', () => {
      it('throws an error when keyOperations is undefined or empty', async () => {
        expect(() => alg.checkKeyOperations({ allowedKeyOperations: ['sign'] } as any)).to.throw(TypeError, 'Required parameter missing or empty');
        expect(() => alg.checkKeyOperations({ keyOperations: [], allowedKeyOperations: ['sign'] })).to.throw(TypeError, 'Required parameter missing or empty');
      });

      it('throws an error when keyOperations are not in allowedKeyOperations', async () => {
        const keyOperations: JwkOperation[] = ['encrypt', 'decrypt'];
        const allowedKeyOperations: JwkOperation[] = ['sign', 'verify'];
        expect(() => alg.checkKeyOperations({ keyOperations, allowedKeyOperations })).to.throw(InvalidAccessError, 'is not valid for the provided key');
      });

      it('does not throw an error when keyOperations are in allowedKeyOperations', async () => {
        const keyOperations: JwkOperation[] = ['sign', 'verify'];
        const allowedKeyOperations: JwkOperation[] = ['sign', 'verify', 'encrypt', 'decrypt'];
        expect(() => alg.checkKeyOperations({ keyOperations, allowedKeyOperations })).not.to.throw();
      });
    });
  });

  // describe.skip('BaseAesAlgorithm', () => {
  //   class TestAesAlgorithm extends BaseAesAlgorithm {
  //     public name = 'TestAlgorithm';
  //     public keyOperations: JwkOperation[] = ['decrypt', 'encrypt'];
  //     public async decrypt(): Promise<Uint8Array> {
  //       return null as any;
  //     }
  //     public async encrypt(): Promise<Uint8Array> {
  //       return null as any;
  //     }
  //     public async generateKey(): Promise<Web5Crypto.CryptoKey> {
  //       return null as any;
  //     }
  //   }

  //   describe('checkGenerateKey()', () => {
  //     let alg: TestAesAlgorithm;

  //     beforeEach(() => {
  //       alg = TestAesAlgorithm.create();
  //     });

  //     it('does not throw with supported algorithm, length, and key operation', () => {
  //       expect(() => alg.checkGenerateKey({
  //         algorithm : { name: 'TestAlgorithm', length: 128 },
  //         keyOperations : ['encrypt']
  //       })).to.not.throw();
  //     });

  //     it('throws an error when unsupported algorithm specified', () => {
  //       expect(() => alg.checkGenerateKey({
  //         algorithm : { name: 'ECDSA', length: 128 },
  //         keyOperations : ['encrypt']
  //       })).to.throw(NotSupportedError, 'Algorithm not supported');
  //     });

  //     it('throws an error when the length property is missing', () => {
  //       expect(() => alg.checkGenerateKey({
  //         // @ts-expect-error because length was intentionally omitted.
  //         algorithm : { name: 'TestAlgorithm' },
  //         keyOperations : ['encrypt']
  //       })).to.throw(TypeError, 'Required parameter missing');
  //     });

  //     it('throws an error when the specified length is not a Number', () => {
  //       expect(() => alg.checkGenerateKey({
  //         // @ts-expect-error because length is intentionally set as a string instead of number.
  //         algorithm : { name: 'TestAlgorithm', length: '256' },
  //         keyOperations : ['encrypt']
  //       })).to.throw(TypeError, `is not of type: Number`);
  //     });

  //     it('throws an error when the specified length is not valid', () => {
  //       [64, 96, 160, 224, 512].forEach((length) => {
  //         expect(() => alg.checkGenerateKey({
  //           algorithm : { name: 'TestAlgorithm', length },
  //           keyOperations : ['encrypt']
  //         })).to.throw(OperationError, `Algorithm 'length' must be 128, 192, or 256`);
  //       });
  //     });

  //     it('throws an error when the requested operation is not valid', () => {
  //       ['sign', 'verify'].forEach((operation) => {
  //         expect(() => alg.checkGenerateKey({
  //           algorithm : { name: 'TestAlgorithm', length: 128 },
  //           keyOperations : [operation as JwkOperation]
  //         })).to.throw(InvalidAccessError, 'Requested operation');
  //       });
  //     });
  //   });

  //   describe('deriveBits()', () => {
  //     it(`throws an error because 'deriveBits' operation is valid for AES-CTR keys`, async () => {
  //       const alg = TestAesAlgorithm.create();
  //       await expect(alg.deriveBits()).to.eventually.be.rejectedWith(InvalidAccessError, 'is not valid for');
  //     });
  //   });

  //   describe('sign()', () => {
  //     it(`throws an error because 'sign' operation is valid for AES-CTR keys`, async () => {
  //       const alg = TestAesAlgorithm.create();
  //       await expect(alg.sign()).to.eventually.be.rejectedWith(InvalidAccessError, 'is not valid for');
  //     });
  //   });

  //   describe('verify()', () => {
  //     it(`throws an error because 'verify' operation is valid for AES-CTR keys`, async () => {
  //       const alg = TestAesAlgorithm.create();
  //       await expect(alg.verify()).to.eventually.be.rejectedWith(InvalidAccessError, 'is not valid for');
  //     });
  //   });

  //   describe('BaseAesCtrAlgorithm', () => {
  //     let alg: BaseAesCtrAlgorithm;

  //     before(() => {
  //       alg = Reflect.construct(BaseAesCtrAlgorithm, []) as BaseAesCtrAlgorithm;
  //     });

  //     let dataEncryptionKey: Web5Crypto.CryptoKey;

  //     beforeEach(() => {
  //       dataEncryptionKey = new CryptoKey({ name: 'AES-CTR', length: 128 }, false, new Uint8Array(32), 'secret', ['encrypt', 'decrypt']);
  //     });

  //     describe('checkAlgorithmOptions()', () => {
  //       it('does not throw with matching algorithm name and valid counter and length', () => {
  //         expect(() => alg.checkAlgorithmOptions({
  //           algorithm: {
  //             name    : 'AES-CTR',
  //             counter : new Uint8Array(16),
  //             length  : 128
  //           },
  //           key: dataEncryptionKey
  //         })).to.not.throw();
  //       });

  //       it('throws an error when unsupported algorithm specified', () => {
  //         expect(() => alg.checkAlgorithmOptions({
  //           algorithm: {
  //             name    : 'invalid-name',
  //             counter : new Uint8Array(16),
  //             length  : 128
  //           },
  //           key: dataEncryptionKey
  //         })).to.throw(NotSupportedError, 'Algorithm not supported');
  //       });

  //       it('throws an error if the counter property is missing', () => {
  //       // @ts-expect-error because `counter` property is intentionally omitted.
  //         expect(() => alg.checkAlgorithmOptions({ algorithm: {
  //           name   : 'AES-CTR',
  //           length : 128
  //         }})).to.throw(TypeError, 'Required parameter missing');
  //       });

  //       it('accepts counter as Uint8Array', () => {
  //         const data = new Uint8Array(16);
  //         const algorithm: { name?: string, counter?: any, length?: number } = {};
  //         algorithm.name = 'AES-CTR';
  //         algorithm.length = 128;

  //         // TypedArray - Uint8Array
  //         algorithm.counter = data;
  //         expect(() => alg.checkAlgorithmOptions({
  //           algorithm : algorithm as Web5Crypto.AesCtrOptions,
  //           key       : dataEncryptionKey
  //         })).to.not.throw();
  //       });

  //       it('throws error if counter is not acceptable data type', () => {
  //         expect(() => alg.checkAlgorithmOptions({
  //           algorithm: {
  //             name    : 'AES-CTR',
  //             // @ts-expect-error because counter is being intentionally set to the wrong data type to trigger an error.
  //             counter : new Set([...Array(16).keys()].map(n => n.toString(16))),
  //             length  : 128
  //           },
  //           key: dataEncryptionKey
  //         })).to.throw(TypeError, 'is not of type');
  //       });

  //       it('throws error if initial value of the counter block is not 16 bytes', () => {
  //         expect(() => alg.checkAlgorithmOptions({
  //           algorithm: {
  //             name    : 'AES-CTR',
  //             counter : new Uint8Array(128),
  //             length  : 128
  //           },
  //           key: dataEncryptionKey
  //         })).to.throw(OperationError, 'must have length');
  //       });

  //       it('throws an error if the length property is missing', () => {
  //         // @ts-expect-error because lengthy property was intentionally omitted.
  //         expect(() => alg.checkAlgorithmOptions({ algorithm: {
  //           name    : 'AES-CTR',
  //           counter : new Uint8Array(16)
  //         }})).to.throw(TypeError, `Required parameter missing: 'length'`);
  //       });

  //       it('throws an error if length is not a Number', () => {
  //         expect(() => alg.checkAlgorithmOptions({ algorithm: {
  //           name    : 'AES-CTR',
  //           counter : new Uint8Array(16),
  //           // @ts-expect-error because length is being intentionally specified as a string instead of a number.
  //           length  : '128'
  //         }})).to.throw(TypeError, 'is not of type');
  //       });

  //       it('throws an error if length is not between 1 and 128', () => {
  //         expect(() => alg.checkAlgorithmOptions({
  //           algorithm: {
  //             name    : 'AES-CTR',
  //             counter : new Uint8Array(16),
  //             length  : 0
  //           },
  //           key: dataEncryptionKey
  //         })).to.throw(OperationError, 'should be in the range');

  //         expect(() => alg.checkAlgorithmOptions({
  //           algorithm: {
  //             name    : 'AES-CTR',
  //             counter : new Uint8Array(16),
  //             length  : 256
  //           },
  //           key: dataEncryptionKey
  //         })).to.throw(OperationError, 'should be in the range');
  //       });

  //       it('throws an error if the key property is missing', () => {
  //         // @ts-expect-error because key property was intentionally omitted.
  //         expect(() => alg.checkAlgorithmOptions({ algorithm: {
  //           name    : 'AES-CTR',
  //           counter : new Uint8Array(16),
  //           length  : 64
  //         }})).to.throw(TypeError, `Required parameter missing: 'key'`);
  //       });

  //       it('throws an error if the given key is not valid', () => {
  //         // @ts-ignore-error because a required property is being intentionally deleted to trigger the check to throw.
  //         delete dataEncryptionKey.extractable;
  //         expect(() => alg.checkAlgorithmOptions({
  //           algorithm : { name: 'AES-CTR', counter: new Uint8Array(16), length: 64 },
  //           key       : dataEncryptionKey
  //         })).to.throw(TypeError, 'Object is not a CryptoKey');
  //       });

  //       it('throws an error if the algorithm of the key does not match', () => {
  //         const dataEncryptionKey = new CryptoKey({ name: 'non-existent-algorithm', length: 128 }, false, new Uint8Array(32), 'secret', ['encrypt', 'decrypt']);
  //         expect(() => alg.checkAlgorithmOptions({
  //           algorithm : { name: 'AES-CTR', counter: new Uint8Array(16), length: 64 },
  //           key       : dataEncryptionKey
  //         })).to.throw(InvalidAccessError, 'does not match');
  //       });

  //       it('throws an error if a private key is specified as the key', () => {
  //         const dataEncryptionKey = new CryptoKey({ name: 'AES-CTR', length: 128 }, false, new Uint8Array(32), 'private', ['encrypt', 'decrypt']);
  //         expect(() => alg.checkAlgorithmOptions({
  //           algorithm : { name: 'AES-CTR', counter: new Uint8Array(16), length: 64 },
  //           key       : dataEncryptionKey
  //         })).to.throw(InvalidAccessError, 'Requested operation is not valid');
  //       });

  //       it('throws an error if a public key is specified as the key', () => {
  //         const dataEncryptionKey = new CryptoKey({ name: 'AES-CTR', length: 128 }, false, new Uint8Array(32), 'public', ['encrypt', 'decrypt']);
  //         expect(() => alg.checkAlgorithmOptions({
  //           algorithm : { name: 'AES-CTR', counter: new Uint8Array(16), length: 64 },
  //           key       : dataEncryptionKey
  //         })).to.throw(InvalidAccessError, 'Requested operation is not valid');
  //       });
  //     });
  //   });
  // });

  describe('BaseEllipticCurveAlgorithm', () => {
    class TestEllipticCurveAlgorithm extends BaseEllipticCurveAlgorithm {
      public name = 'TestAlgorithm';
      public curves = ['curveA'];
      public keyOperations: JwkOperation[] = ['decrypt'];
      public async deriveBits(): Promise<Uint8Array> {
        return null as any;
      }
      public async generateKey(): Promise<PrivateKeyJwk> {
        return null as any;
      }
      public async sign(): Promise<Uint8Array> {
        return null as any;
      }
      public async verify(): Promise<boolean> {
        return null as any;
      }
    }

    describe('checkGenerateKey()', () => {
      let alg: TestEllipticCurveAlgorithm;

      beforeEach(() => {
        alg = TestEllipticCurveAlgorithm.create();
      });

      it('does not throw with supported algorithm, named curve, and key operation', () => {
        expect(() => alg.checkGenerateKey({
          algorithm     : { name: 'TestAlgorithm', curve: 'curveA' },
          keyOperations : ['decrypt']
        })).to.not.throw();
      });

      it('throws an error when unsupported algorithm specified', () => {
        expect(() => alg.checkGenerateKey({
          algorithm     : { name: 'ECDH', curve: 'X25519' },
          keyOperations : ['sign']
        })).to.throw(NotSupportedError, 'Algorithm not supported');
      });

      it('throws an error when unsupported named curve specified', () => {
        expect(() => alg.checkGenerateKey({
          algorithm     : { name: 'TestAlgorithm', curve: 'X25519' },
          keyOperations : ['sign']
        })).to.throw(TypeError, 'Out of range');
      });

      it('throws an error when the requested operation is not valid', () => {
        ['sign', 'verify'].forEach((operation) => {
          expect(() => alg.checkGenerateKey({
            algorithm     : { name: 'TestAlgorithm', curve: 'curveA' },
            keyOperations : [operation as JwkOperation]
          })).to.throw(InvalidAccessError, 'Requested operation');
        });
      });
    });

    describe('decrypt()', () => {
      it(`throws an error because 'decrypt' operation is valid for AES-CTR keys`, async () => {
        const alg = TestEllipticCurveAlgorithm.create();
        await expect(alg.decrypt()).to.eventually.be.rejectedWith(InvalidAccessError, 'is not valid for');
      });
    });

    describe('encrypt()', () => {
      it(`throws an error because 'encrypt' operation is valid for AES-CTR keys`, async () => {
        const alg = TestEllipticCurveAlgorithm.create();
        await expect(alg.encrypt()).to.eventually.be.rejectedWith(InvalidAccessError, 'is not valid for');
      });
    });
  });

  describe('BaseEcdhAlgorithm', () => {
    let alg: BaseEcdhAlgorithm;

    before(() => {
      alg = Reflect.construct(BaseEcdhAlgorithm, []) as BaseEcdhAlgorithm;
    });

    describe('checkAlgorithmOptions()', () => {
      let otherPartyPublicKey: PublicKeyJwk;
      let ownPrivateKey: PrivateKeyJwk;

      beforeEach(() => {
        otherPartyPublicKey = {
          kty     : 'OKP',
          crv     : 'X25519',
          x       : Convert.uint8Array(new Uint8Array(32)).toBase64Url(),
          key_ops : ['deriveBits', 'deriveKey']
        };
        ownPrivateKey = {
          kty     : 'OKP',
          crv     : 'X25519',
          x       : Convert.uint8Array(new Uint8Array(32)).toBase64Url(),
          d       : Convert.uint8Array(new Uint8Array(32)).toBase64Url(),
          key_ops : ['deriveBits', 'deriveKey']
        };
      });

      it('does not throw with matching algorithm name and valid publicKey and baseKey', () => {
        expect(() => alg.checkAlgorithmOptions({
          algorithm : { name: 'ECDH', publicKey: otherPartyPublicKey },
          baseKey   : ownPrivateKey
        })).to.not.throw();
      });

      it('throws an error when unsupported algorithm specified', () => {
        expect(() => alg.checkAlgorithmOptions({
          algorithm : { name: 'non-existent-algorithm', publicKey: otherPartyPublicKey },
          baseKey   : ownPrivateKey
        })).to.throw(NotSupportedError, 'Algorithm not supported');
      });

      it('throws an error if the publicKey property is missing', () => {
        expect(() => alg.checkAlgorithmOptions({
          // @ts-expect-error because `publicKey` property is intentionally omitted.
          algorithm : { name: 'ECDH' },
          baseKey   : ownPrivateKey
        })).to.throw(TypeError, `Required parameter missing: 'publicKey'`);
      });

      it('throws an error if the given publicKey is not valid', () => {
        const { kty, ...otherPartyPublicKeyMissingKeyType } = otherPartyPublicKey as JwkParamsEcPublic;
        expect(() => alg.checkAlgorithmOptions({
          // @ts-ignore-error because a required property is being intentionally deleted to trigger the check to throw.
          algorithm : { name: 'ECDH', publicKey: otherPartyPublicKeyMissingKeyType },
          baseKey   : ownPrivateKey
        })).to.throw(TypeError, 'Object is not a JSON Web Key');

        const { crv, ...otherPartyPublicKeyMissingCurve } = otherPartyPublicKey as JwkParamsEcPublic;
        expect(() => alg.checkAlgorithmOptions({
          // @ts-ignore-error because a required property is being intentionally deleted to trigger the check to throw.
          algorithm : { name: 'ECDH', publicKey: otherPartyPublicKeyMissingCurve },
          baseKey   : ownPrivateKey
        })).to.throw(InvalidAccessError, 'Requested operation is only valid for public keys');

        const { x, ...otherPartyPublicKeyMissingX } = otherPartyPublicKey as JwkParamsEcPublic;
        expect(() => alg.checkAlgorithmOptions({
          // @ts-ignore-error because a required property is being intentionally deleted to trigger the check to throw.
          algorithm : { name: 'ECDH', publicKey: otherPartyPublicKeyMissingX },
          baseKey   : ownPrivateKey
        })).to.throw(InvalidAccessError, 'Requested operation is only valid for public keys');
      });

      it('throws an error if the key type of the publicKey is not EC or OKP', () => {
        otherPartyPublicKey.kty = 'RSA';
        expect(() => alg.checkAlgorithmOptions({
          algorithm : { name: 'ECDH', publicKey: otherPartyPublicKey },
          baseKey   : ownPrivateKey
        })).to.throw(InvalidAccessError, 'Key type of the provided key must be');
      });

      it('throws an error if a private key is specified as the publicKey', () => {
        expect(() => alg.checkAlgorithmOptions({
          // @ts-expect-error since a private key is being intentionally provided to trigger the error.
          algorithm : { name: 'ECDH', publicKey: ownPrivateKey },
          baseKey   : ownPrivateKey
        })).to.throw(InvalidAccessError, 'Requested operation is only valid');
      });

      it('throws an error if the baseKey property is missing', () => {
        // @ts-expect-error because `baseKey` property is intentionally omitted.
        expect(() => alg.checkAlgorithmOptions({
          algorithm: { name: 'ECDH', publicKey: otherPartyPublicKey  }
        })).to.throw(TypeError, `Required parameter missing: 'baseKey'`);
      });

      it('throws an error if the given baseKey is not valid', () => {
        const { kty, ...ownPrivateKeyMissingKeyType } = ownPrivateKey as JwkParamsEcPrivate;
        expect(() => alg.checkAlgorithmOptions({
          algorithm : { name: 'ECDH', publicKey: otherPartyPublicKey },
          // @ts-ignore-error because a required property is being intentionally deleted to trigger the check to throw.
          baseKey   : ownPrivateKeyMissingKeyType
        })).to.throw(TypeError, 'Object is not a JSON Web Key');

        const { crv, ...ownPrivateKeyMissingCurve } = ownPrivateKey as JwkParamsEcPrivate;
        expect(() => alg.checkAlgorithmOptions({
          algorithm : { name: 'ECDH', publicKey: otherPartyPublicKey },
          // @ts-ignore-error because a required property is being intentionally deleted to trigger the check to throw.
          baseKey   : ownPrivateKeyMissingCurve
        })).to.throw(InvalidAccessError, 'Requested operation is only valid for private keys');

        const { x, ...ownPrivateKeyMissingX } = ownPrivateKey as JwkParamsEcPrivate;
        expect(() => alg.checkAlgorithmOptions({
          algorithm : { name: 'ECDH', publicKey: otherPartyPublicKey },
          // @ts-ignore-error because a required property is being intentionally deleted to trigger the check to throw.
          baseKey   : ownPrivateKeyMissingX
        })).to.throw(InvalidAccessError, 'Requested operation is only valid for private keys');

        const { d, ...ownPrivateKeyMissingD } = ownPrivateKey as JwkParamsEcPrivate;
        expect(() => alg.checkAlgorithmOptions({
          algorithm : { name: 'ECDH', publicKey: otherPartyPublicKey },
          // @ts-ignore-error because a required property is being intentionally deleted to trigger the check to throw.
          baseKey   : ownPrivateKeyMissingD
        })).to.throw(InvalidAccessError, 'Requested operation is only valid for private keys');
      });

      it('throws an error if the key type of the baseKey is not EC or OKP', () => {
        ownPrivateKey.kty = 'RSA';
        expect(() => alg.checkAlgorithmOptions({
          algorithm : { name: 'ECDH', publicKey: otherPartyPublicKey },
          baseKey   : ownPrivateKey
        })).to.throw(InvalidAccessError, 'Key type of the provided key must be');
      });

      it('throws an error if a public key is specified as the baseKey', () => {
        expect(() => alg.checkAlgorithmOptions({
          algorithm : { name: 'ECDH', publicKey: otherPartyPublicKey },
          // @ts-expect-error because public key is being provided instead of private key.
          baseKey   : otherPartyPublicKey
        })).to.throw(InvalidAccessError, 'Requested operation is only valid for private keys');
      });

      it('throws an error if the key type of the public and base keys does not match', () => {
        ownPrivateKey.kty = 'EC';
        otherPartyPublicKey.kty = 'OKP';
        expect(() => alg.checkAlgorithmOptions({
          algorithm : { name: 'ECDH', publicKey: otherPartyPublicKey },
          baseKey   : ownPrivateKey
        })).to.throw(InvalidAccessError, `key type of the publicKey and baseKey must match`);
      });

      it('throws an error if the curve of the public and base keys does not match', () => {
        (ownPrivateKey as JwkParamsEcPrivate).crv = 'secp256k1';
        (otherPartyPublicKey as JwkParamsOkpPublic).crv = 'X25519';
        expect(() => alg.checkAlgorithmOptions({
          algorithm : { name: 'ECDH', publicKey: otherPartyPublicKey },
          baseKey   : ownPrivateKey
        })).to.throw(InvalidAccessError, `curve of the publicKey and baseKey must match`);
      });
    });

    describe('sign()', () => {
      it(`throws an error because 'sign' operation is valid for ECDH keys`, async () => {
        await expect(alg.sign()).to.eventually.be.rejectedWith(InvalidAccessError, 'is not valid for ECDH');
      });
    });

    describe('verify()', () => {
      it(`throws an error because 'verify' operation is valid for ECDH keys`, async () => {
        await expect(alg.verify()).to.eventually.be.rejectedWith(InvalidAccessError, 'is not valid for ECDH');
      });
    });
  });

  //   describe('BaseEcdsaAlgorithm', () => {
  //     let alg: BaseEcdsaAlgorithm;

  //     before(() => {
  //       alg = Reflect.construct(BaseEcdsaAlgorithm, []) as BaseEcdsaAlgorithm;
  //       // @ts-expect-error because `hashAlgorithms` is a read-only property.
  //       alg.hashAlgorithms = ['SHA-256'];
  //     });

  //     describe('checkAlgorithmOptions()', () => {
  //       it('does not throw with matching algorithm name and valid hash algorithm', () => {
  //         expect(() => alg.checkAlgorithmOptions({ algorithm: {
  //           name : 'ECDSA',
  //           hash : 'SHA-256'
  //         }})).to.not.throw();
  //       });

  //       it('throws an error when unsupported algorithm specified', () => {
  //         expect(() => alg.checkAlgorithmOptions({ algorithm: {
  //           name : 'Nope',
  //           hash : 'SHA-256'
  //         }})).to.throw(NotSupportedError, 'Algorithm not supported');
  //       });

  //       it('throws an error if the hash property is missing', () => {
  //         // @ts-expect-error because `hash` property is intentionally omitted.
  //         expect(() => alg.checkAlgorithmOptions({ algorithm: {
  //           name: 'ECDSA',
  //         }})).to.throw(TypeError, 'Required parameter missing');
  //       });

  //       it('throws an error if the given hash algorithm is not supported', () => {
  //         const ecdhPublicKey = new CryptoKey({ name: 'ECDH', curve: 'X25519' }, false, new Uint8Array(32), 'public', ['deriveBits', 'deriveKey']);
  //         // @ts-ignore-error because a required property is being intentionally deleted to trigger the check to throw.
  //         delete ecdhPublicKey.extractable;
  //         expect(() => alg.checkAlgorithmOptions({ algorithm: {
  //           name : 'ECDSA',
  //           hash : 'SHA-1234'
  //         }})).to.throw(TypeError, 'Out of range');
  //       });
  //     });

  //     describe('deriveBits()', () => {
  //       it(`throws an error because 'deriveBits' operation is valid for ECDSA keys`, async () => {
  //         await expect(alg.deriveBits()).to.eventually.be.rejectedWith(InvalidAccessError, `is not valid for ECDSA`);
  //       });
  //     });
  //   });

  //   describe('BaseEdDsaAlgorithm', () => {
  //     let alg: BaseEdDsaAlgorithm;

  //     before(() => {
  //       alg = Reflect.construct(BaseEdDsaAlgorithm, []) as BaseEdDsaAlgorithm;
  //     });

  //     describe('checkAlgorithmOptions()', () => {
  //       const testEdDsaAlgorithm = Reflect.construct(BaseEdDsaAlgorithm, []) as BaseEdDsaAlgorithm;

  //       it('does not throw with matching algorithm name', () => {
  //         expect(() => testEdDsaAlgorithm.checkAlgorithmOptions({ algorithm: {
  //           name: 'EdDSA'
  //         }})).to.not.throw();
  //       });

  //       it('throws an error when unsupported algorithm specified', () => {
  //         expect(() => testEdDsaAlgorithm.checkAlgorithmOptions({ algorithm: {
  //           name: 'Nope'
  //         }})).to.throw(NotSupportedError, 'Algorithm not supported');
  //       });
  //     });

  //     describe('deriveBits()', () => {
  //       it(`throws an error because 'deriveBits' operation is valid for EdDSA keys`, async () => {
  //         await expect(alg.deriveBits()).to.eventually.be.rejectedWith(InvalidAccessError, `is not valid for EdDSA`);
  //       });
  //     });
  //   });
  // });

  describe('BasePbkdf2Algorithm', () => {
    let alg: BasePbkdf2Algorithm;

    before(() => {
      alg = Reflect.construct(BasePbkdf2Algorithm, []) as BasePbkdf2Algorithm;
      // @ts-expect-error because `hashAlgorithms` is a read-only property.
      alg.hashAlgorithms = ['SHA-256'];
    });

    describe('checkAlgorithmOptions()', () => {

      let baseKey: PrivateKeyJwk;

      beforeEach(() => {
        baseKey = {
          kty     : 'oct',
          k       : Convert.uint8Array(new Uint8Array(32)).toBase64Url(),
          key_ops : ['deriveBits', 'deriveKey']
        };
      });

      it('does not throw with matching algorithm name and valid hash, iterations, and salt', () => {
        expect(() => alg.checkAlgorithmOptions({
          algorithm: {
            name       : 'PBKDF2',
            hash       : 'SHA-256',
            iterations : 1000,
            salt       : new Uint8Array(16)
          },
          baseKey
        })).to.not.throw();
      });

      it('throws an error when unsupported algorithm specified', () => {
        expect(() => alg.checkAlgorithmOptions({
          algorithm: {
            name       : 'invalid-name',
            hash       : 'SHA-256',
            iterations : 1000,
            salt       : new Uint8Array(16)
          },
          baseKey
        })).to.throw(NotSupportedError, 'Algorithm not supported');
      });

      it('throws an error if the hash property is missing', () => {
        expect(() => alg.checkAlgorithmOptions({
          // @ts-expect-error because `hash` property is intentionally omitted.
          algorithm: {
            name       : 'PBKDF2',
            iterations : 1000,
            salt       : new Uint8Array(16)
          },
          baseKey
        })).to.throw(TypeError, 'Required parameter missing');
      });

      it('throws an error if the given hash algorithm is not supported', () => {
        expect(() => alg.checkAlgorithmOptions({
          algorithm: {
            name       : 'PBKDF2',
            hash       : 'SHA-1',
            iterations : 1000,
            salt       : new Uint8Array(16)
          },
          baseKey
        })).to.throw(TypeError, 'Out of range');
      });

      it('throws an error if the iterations property is missing', () => {
        expect(() => alg.checkAlgorithmOptions({
          // @ts-expect-error because `iterations` property is intentionally omitted.
          algorithm: {
            name : 'PBKDF2',
            hash : 'SHA-256',
            salt : new Uint8Array(16)
          },
          baseKey
        })).to.throw(TypeError, 'Required parameter missing');
      });

      it('throws error if iterations is not a number', () => {
        expect(() => alg.checkAlgorithmOptions({
          algorithm: {
            name       : 'PBKDF2',
            hash       : 'SHA-256',
            // @ts-expect-error because `iterations` is intentionally defined as a string instead of a number.
            iterations : '1000',
            salt       : new Uint8Array(16)
          },
          baseKey
        })).to.throw(TypeError, 'is not of type');
      });

      it('throws error if iterations is not 1 or greater', () => {
        expect(() => alg.checkAlgorithmOptions({
          algorithm: {
            name       : 'PBKDF2',
            hash       : 'SHA-256',
            iterations : 0,
            salt       : new Uint8Array(16)
          },
          baseKey
        })).to.throw(OperationError, 'must be > 0');
      });

      it('throws an error if the salt property is missing', () => {
        expect(() => alg.checkAlgorithmOptions({
          // @ts-expect-error because `salt` property is intentionally omitted.
          algorithm: {
            name : 'PBKDF2',
            hash : 'SHA-256',

          },
          baseKey
        })).to.throw(TypeError, 'Required parameter missing');
      });

      it('throws error if salt is not a Uint8Array', () => {
        expect(() => alg.checkAlgorithmOptions({
          algorithm: {
            name       : 'PBKDF2',
            hash       : 'SHA-256',
            iterations : 1000,
            // @ts-expect-error because counter is being intentionally set to the wrong data type to trigger an error.
            salt       : new Set([...Array(16).keys()].map(n => n.toString(16)))
          },
          baseKey
        })).to.throw(TypeError, 'is not of type');
      });

      it('throws an error if the baseKey property is missing', () => {
        // @ts-expect-error because baseKey property was intentionally omitted.
        expect(() => alg.checkAlgorithmOptions({
          algorithm: {
            name       : 'PBKDF2',
            hash       : 'SHA-256',
            iterations : 1000,
            salt       : new Uint8Array(16)
          },
        })).to.throw(TypeError, `Required parameter missing: 'baseKey'`);
      });

      it('throws an error if the given key is not valid', () => {
        // @ts-ignore-error because a required property is being intentionally deleted to trigger the check to throw.
        delete baseKey.kty;
        expect(() => alg.checkAlgorithmOptions({
          algorithm: {
            name       : 'PBKDF2',
            hash       : 'SHA-256',
            iterations : 1000,
            salt       : new Uint8Array(16)
          },
          baseKey
        })).to.throw(TypeError, 'Object is not a JSON Web Key');
      });

      it('throws an error if the key type of the key is not valid', () => {
        const baseKey: PrivateKeyJwk = {
          kty : 'OKP',
          // @ts-expect-error because OKP JWKs don't have a k parameter.
          k   : Convert.uint8Array(new Uint8Array(32)).toBase64Url()
        };
        expect(() => alg.checkAlgorithmOptions({
          algorithm: {
            name       : 'PBKDF2',
            hash       : 'SHA-256',
            iterations : 1000,
            salt       : new Uint8Array(16)
          },
          baseKey
        })).to.throw(InvalidAccessError, 'Key type of the provided key must be');
      });
    });

    describe('decrypt()', () => {
      it(`throws an error because 'decrypt' operation is valid for PBKDF2 keys`, async () => {
        await expect(alg.decrypt()).to.eventually.be.rejectedWith(InvalidAccessError, 'is not valid for');
      });
    });

    describe('encrypt()', () => {
      it(`throws an error because 'encrypt' operation is valid for PBKDF2 keys`, async () => {
        await expect(alg.encrypt()).to.eventually.be.rejectedWith(InvalidAccessError, 'is not valid for');
      });
    });

    describe('generateKey()', () => {
      it(`throws an error because 'generateKey' operation is valid for PBKDF2 keys`, async () => {
        await expect(alg.generateKey()).to.eventually.be.rejectedWith(InvalidAccessError, 'is not valid for');
      });
    });

    describe('sign()', () => {
      it(`throws an error because 'sign' operation is valid for PBKDF2 keys`, async () => {
        await expect(alg.sign()).to.eventually.be.rejectedWith(InvalidAccessError, 'is not valid for');
      });
    });

    describe('verify()', () => {
      it(`throws an error because 'verify' operation is valid for PBKDF2 keys`, async () => {
        await expect(alg.verify()).to.eventually.be.rejectedWith(InvalidAccessError, 'is not valid for');
      });
    });

  });
});