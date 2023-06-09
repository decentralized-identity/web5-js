import type { Web5Crypto } from '../src/types-new.js';

import { expect } from 'chai';

import { CryptoAlgorithm } from '../src/algorithms-api/index.js';

describe('Algorithms API', () => {
  describe('CryptoAlgorithm', () => {

    class TestCryptoAlgorithm extends CryptoAlgorithm {
      public name = 'Test Algorithm';
      public usages: KeyUsage[] = ['decrypt', 'deriveBits', 'deriveKey', 'encrypt', 'sign', 'unwrapKey', 'verify', 'wrapKey' ];

      public async generateKey(): Promise<Web5Crypto.CryptoKeyPair> {
        // mock implementation
        return {
          publicKey  : {} as any,
          privateKey : {} as any
        };
      }
    }

    let alg: TestCryptoAlgorithm;

    beforeEach(() => {
      alg = TestCryptoAlgorithm.create();
    });

    describe('checkAlgorithmName()', () => {
      it('throws an error if the algorithm name does not match', () => {
        expect(() => alg.checkAlgorithmName('SomeOtherAlgorithm')).to.throw('Algorithm not supported');
      });

      it('does not throw an error if the algorithm name matches', () => {
        expect(() => alg.checkAlgorithmName('Test Algorithm')).to.not.throw();
      });
    });
  });
});

