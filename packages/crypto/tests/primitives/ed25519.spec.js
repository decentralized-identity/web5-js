var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import chai, { expect } from 'chai';
import { Convert } from '@web5/common';
import chaiAsPromised from 'chai-as-promised';
import ed25519Sign from '../fixtures/test-vectors/ed25519/sign.json' assert { type: 'json' };
import ed25519Verify from '../fixtures/test-vectors/ed25519/verify.json' assert { type: 'json' };
import ed25519ComputePublicKey from '../fixtures/test-vectors/ed25519/compute-public-key.json' assert { type: 'json' };
import ed25519BytesToPublicKey from '../fixtures/test-vectors/ed25519/bytes-to-public-key.json' assert { type: 'json' };
import ed25519PublicKeyToBytes from '../fixtures/test-vectors/ed25519/public-key-to-bytes.json' assert { type: 'json' };
import ed25519BytesToPrivateKey from '../fixtures/test-vectors/ed25519/bytes-to-private-key.json' assert { type: 'json' };
import ed25519PrivateKeyToBytes from '../fixtures/test-vectors/ed25519/private-key-to-bytes.json' assert { type: 'json' };
import ed25519ConvertPublicKeyToX25519 from '../fixtures/test-vectors/ed25519/convert-public-key-to-x25519.json' assert { type: 'json' };
import ed25519ConvertPrivateKeyToX25519 from '../fixtures/test-vectors/ed25519/convert-private-key-to-x25519.json' assert { type: 'json' };
import { Ed25519 } from '../../src/primitives/ed25519.js';
chai.use(chaiAsPromised);
describe('Ed25519', () => {
    let privateKey;
    let publicKey;
    before(() => __awaiter(void 0, void 0, void 0, function* () {
        privateKey = yield Ed25519.generateKey();
        publicKey = yield Ed25519.computePublicKey({ key: privateKey });
    }));
    describe('bytesToPrivateKey()', () => {
        it('returns a private key in JWK format', () => __awaiter(void 0, void 0, void 0, function* () {
            const privateKeyBytes = Convert.hex('4ccd089b28ff96da9db6c346ec114e0f5b8a319f35aba624da8cf6ed4fb8a6fb').toUint8Array();
            const privateKey = yield Ed25519.bytesToPrivateKey({ privateKeyBytes });
            expect(privateKey).to.have.property('crv', 'Ed25519');
            expect(privateKey).to.have.property('d');
            expect(privateKey).to.have.property('kid');
            expect(privateKey).to.have.property('kty', 'OKP');
            expect(privateKey).to.have.property('x');
        }));
        for (const vector of ed25519BytesToPrivateKey.vectors) {
            it(vector.description, () => __awaiter(void 0, void 0, void 0, function* () {
                const privateKey = yield Ed25519.bytesToPrivateKey({
                    privateKeyBytes: Convert.hex(vector.input.privateKeyBytes).toUint8Array()
                });
                expect(privateKey).to.deep.equal(vector.output);
            }));
        }
    });
    describe('bytesToPublicKey()', () => {
        it('returns a public key in JWK format', () => __awaiter(void 0, void 0, void 0, function* () {
            const publicKeyBytes = Convert.hex('3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c').toUint8Array();
            const publicKey = yield Ed25519.bytesToPublicKey({ publicKeyBytes });
            expect(publicKey).to.have.property('crv', 'Ed25519');
            expect(publicKey).to.have.property('kid');
            expect(publicKey).to.have.property('kty', 'OKP');
            expect(publicKey).to.have.property('x');
            expect(publicKey).to.not.have.property('d');
        }));
        for (const vector of ed25519BytesToPublicKey.vectors) {
            it(vector.description, () => __awaiter(void 0, void 0, void 0, function* () {
                const publicKey = yield Ed25519.bytesToPublicKey({
                    publicKeyBytes: Convert.hex(vector.input.publicKeyBytes).toUint8Array()
                });
                expect(publicKey).to.deep.equal(vector.output);
            }));
        }
    });
    describe('computePublicKey()', () => {
        it('returns a public key in JWK format', () => __awaiter(void 0, void 0, void 0, function* () {
            const publicKey = yield Ed25519.computePublicKey({ key: privateKey });
            expect(publicKey).to.have.property('kty', 'OKP');
            expect(publicKey).to.have.property('crv', 'Ed25519');
            expect(publicKey).to.have.property('x');
            expect(publicKey).to.not.have.property('d');
        }));
        it('computes and adds a kid property, if missing', () => __awaiter(void 0, void 0, void 0, function* () {
            const { kid } = privateKey, privateKeyWithoutKid = __rest(privateKey, ["kid"]);
            const publicKey = yield Ed25519.computePublicKey({ key: privateKeyWithoutKid });
            expect(publicKey).to.have.property('kid', kid);
        }));
        for (const vector of ed25519ComputePublicKey.vectors) {
            it(vector.description, () => __awaiter(void 0, void 0, void 0, function* () {
                const publicKey = yield Ed25519.computePublicKey(vector.input);
                expect(publicKey).to.deep.equal(vector.output);
            }));
        }
    });
    describe('convertPrivateKeyToX25519()', () => {
        for (const vector of ed25519ConvertPrivateKeyToX25519.vectors) {
            it(vector.description, () => __awaiter(void 0, void 0, void 0, function* () {
                const x25519PrivateKey = yield Ed25519.convertPrivateKeyToX25519(vector.input);
                expect(x25519PrivateKey).to.deep.equal(vector.output);
            }));
        }
    });
    describe('convertPublicKeyToX25519()', () => {
        it('throws an error when provided an invalid Ed25519 public key', () => __awaiter(void 0, void 0, void 0, function* () {
            const invalidEd25519PublicKeyBytes = Convert.hex('02fffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f').toUint8Array();
            const invalidEd25519PublicKey = {
                kty: 'OKP',
                crv: 'Ed25519',
                x: Convert.uint8Array(invalidEd25519PublicKeyBytes).toBase64Url()
            };
            yield expect(Ed25519.convertPublicKeyToX25519({ publicKey: invalidEd25519PublicKey })).to.eventually.be.rejectedWith(Error, 'Invalid public key');
        }));
        it('throws an error when provided an Ed25519 private key', () => __awaiter(void 0, void 0, void 0, function* () {
            const ed25519PrivateKey = {
                kty: 'OKP',
                crv: 'Ed25519',
                d: 'dwdtCnMYpX08FsFyUbJmRd9ML4frwJkqsXf7pR25LCo',
                x: '0KTOwPi1C6HpNuxWFUVKqX37J4ZPXxdgivLLsQVI8bM'
            };
            yield expect(Ed25519.convertPublicKeyToX25519({ publicKey: ed25519PrivateKey })).to.eventually.be.rejectedWith(Error, 'provided key is not a valid OKP public key');
        }));
        for (const vector of ed25519ConvertPublicKeyToX25519.vectors) {
            it(vector.description, () => __awaiter(void 0, void 0, void 0, function* () {
                const x25519PrivateKey = yield Ed25519.convertPublicKeyToX25519(vector.input);
                expect(x25519PrivateKey).to.deep.equal(vector.output);
            }));
        }
    });
    describe('generateKey()', () => {
        it('returns a private key in JWK format', () => __awaiter(void 0, void 0, void 0, function* () {
            const privateKey = yield Ed25519.generateKey();
            expect(privateKey).to.have.property('crv', 'Ed25519');
            expect(privateKey).to.have.property('d');
            expect(privateKey).to.have.property('kid');
            expect(privateKey).to.have.property('kty', 'OKP');
            expect(privateKey).to.have.property('x');
        }));
        it('returns a 32-byte private key', () => __awaiter(void 0, void 0, void 0, function* () {
            const privateKey = yield Ed25519.generateKey();
            const privateKeyBytes = Convert.base64Url(privateKey.d).toUint8Array();
            expect(privateKeyBytes.byteLength).to.equal(32);
        }));
    });
    describe('getPublicKey()', () => {
        it('returns a public key in JWK format', () => __awaiter(void 0, void 0, void 0, function* () {
            const publicKey = yield Ed25519.getPublicKey({ key: privateKey });
            expect(publicKey).to.have.property('kty', 'OKP');
            expect(publicKey).to.have.property('crv', 'Ed25519');
            expect(publicKey).to.have.property('x');
            expect(publicKey).to.not.have.property('d');
        }));
        it('computes and adds a kid property, if missing', () => __awaiter(void 0, void 0, void 0, function* () {
            const { kid } = privateKey, privateKeyWithoutKid = __rest(privateKey, ["kid"]);
            const publicKey = yield Ed25519.getPublicKey({ key: privateKeyWithoutKid });
            expect(publicKey).to.have.property('kid', kid);
        }));
        it('returns the same output as computePublicKey()', () => __awaiter(void 0, void 0, void 0, function* () {
            const publicKey = yield Ed25519.getPublicKey({ key: privateKey });
            expect(publicKey).to.deep.equal(yield Ed25519.computePublicKey({ key: privateKey }));
        }));
        it('throws an error when provided an Ed25519 public key', () => __awaiter(void 0, void 0, void 0, function* () {
            yield expect(Ed25519.getPublicKey({ key: publicKey })).to.eventually.be.rejectedWith(Error, 'key is not an Ed25519 private JWK');
        }));
        it('throws an error when provided an secp256k1 private key', () => __awaiter(void 0, void 0, void 0, function* () {
            const secp256k1PrivateKey = {
                kty: 'EC',
                crv: 'secp256k1',
                x: 'N1KVEnQCMpbIp0sP_kL4L_S01LukMmR3QicD92H1klg',
                y: 'wmp0ZbmnesDD8c7bE5xCiwsfu1UWhntSdjbzKG9wVVM',
                kid: 'iwwOeCqgvREo5xGeBS-obWW9ZGjv0o1M65gUYN6SYh4'
            };
            yield expect(Ed25519.getPublicKey({ key: secp256k1PrivateKey })).to.eventually.be.rejectedWith(Error, 'key is not an Ed25519 private JWK');
        }));
        it('throws an error when provided an X25519 private key', () => __awaiter(void 0, void 0, void 0, function* () {
            const x25519PrivateKey = {
                kty: 'OKP',
                crv: 'X25519',
                d: 'jxSSX_aM49m6E4MaSd-hcizIM33rXzLltuev9oBw1V8',
                x: 'U2kX2FckTAoTAjMBUadwOpftdXk-Kx8pZMeyG3QZsy8',
                kid: 'PPgSyqA-j9sc9vmsvpSCpy2uLg_CUfGoKHhPzQ5Gkog'
            };
            yield expect(Ed25519.getPublicKey({ key: x25519PrivateKey })).to.eventually.be.rejectedWith(Error, 'key is not an Ed25519 private JWK');
        }));
    });
    describe('privateKeyToBytes()', () => {
        it('returns a private key as a byte array', () => __awaiter(void 0, void 0, void 0, function* () {
            const privateKey = {
                crv: 'Ed25519',
                d: 'TM0Imyj_ltqdtsNG7BFOD1uKMZ81q6Yk2oz27U-4pvs',
                kty: 'OKP',
                x: 'PUAXw-hDiVqStwqnTRt-vJyYLM8uxJaMwM1V8Sr0Zgw',
                kid: 'FtIu-VbGrfe_KB6CH7GNwODB72MNxj_ml11dEvO-7kk'
            };
            const privateKeyBytes = yield Ed25519.privateKeyToBytes({ privateKey });
            expect(privateKeyBytes).to.be.an.instanceOf(Uint8Array);
            const expectedOutput = Convert.hex('4ccd089b28ff96da9db6c346ec114e0f5b8a319f35aba624da8cf6ed4fb8a6fb').toUint8Array();
            expect(privateKeyBytes).to.deep.equal(expectedOutput);
        }));
        it('throws an error when provided an Ed25519 public key', () => __awaiter(void 0, void 0, void 0, function* () {
            const publicKey = {
                crv: 'Ed25519',
                kty: 'OKP',
                x: 'PUAXw-hDiVqStwqnTRt-vJyYLM8uxJaMwM1V8Sr0Zgw',
            };
            yield expect(Ed25519.privateKeyToBytes({ privateKey: publicKey })).to.eventually.be.rejectedWith(Error, 'provided key is not a valid OKP private key');
        }));
        for (const vector of ed25519PrivateKeyToBytes.vectors) {
            it(vector.description, () => __awaiter(void 0, void 0, void 0, function* () {
                const privateKeyBytes = yield Ed25519.privateKeyToBytes({
                    privateKey: vector.input.privateKey
                });
                expect(privateKeyBytes).to.deep.equal(Convert.hex(vector.output).toUint8Array());
            }));
        }
    });
    describe('publicKeyToBytes()', () => {
        it('returns a public key in JWK format', () => __awaiter(void 0, void 0, void 0, function* () {
            const publicKey = {
                kty: 'OKP',
                crv: 'Ed25519',
                x: 'PUAXw-hDiVqStwqnTRt-vJyYLM8uxJaMwM1V8Sr0Zgw',
                kid: 'FtIu-VbGrfe_KB6CH7GNwODB72MNxj_ml11dEvO-7kk'
            };
            const publicKeyBytes = yield Ed25519.publicKeyToBytes({ publicKey });
            expect(publicKeyBytes).to.be.an.instanceOf(Uint8Array);
            const expectedOutput = Convert.hex('3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c').toUint8Array();
            expect(publicKeyBytes).to.deep.equal(expectedOutput);
        }));
        it('throws an error when provided an Ed25519 private key', () => __awaiter(void 0, void 0, void 0, function* () {
            const privateKey = {
                crv: 'Ed25519',
                d: 'TM0Imyj_ltqdtsNG7BFOD1uKMZ81q6Yk2oz27U-4pvs',
                kty: 'OKP',
                x: 'PUAXw-hDiVqStwqnTRt-vJyYLM8uxJaMwM1V8Sr0Zgw',
                kid: 'FtIu-VbGrfe_KB6CH7GNwODB72MNxj_ml11dEvO-7kk'
            };
            yield expect(Ed25519.publicKeyToBytes({ publicKey: privateKey })).to.eventually.be.rejectedWith(Error, 'provided key is not a valid OKP public key');
        }));
        for (const vector of ed25519PublicKeyToBytes.vectors) {
            it(vector.description, () => __awaiter(void 0, void 0, void 0, function* () {
                const publicKeyBytes = yield Ed25519.publicKeyToBytes({
                    publicKey: vector.input.publicKey
                });
                expect(publicKeyBytes).to.deep.equal(Convert.hex(vector.output).toUint8Array());
            }));
        }
    });
    describe('sign()', () => {
        it('returns a 64-byte signature of type Uint8Array', () => __awaiter(void 0, void 0, void 0, function* () {
            const data = new Uint8Array([51, 52, 53]);
            const signature = yield Ed25519.sign({ key: privateKey, data });
            expect(signature).to.be.instanceOf(Uint8Array);
            expect(signature.byteLength).to.equal(64);
        }));
        it('accepts input data as Uint8Array', () => __awaiter(void 0, void 0, void 0, function* () {
            const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
            let signature;
            signature = yield Ed25519.sign({ key: privateKey, data: data });
            expect(signature).to.be.instanceOf(Uint8Array);
        }));
        for (const vector of ed25519Sign.vectors) {
            it(vector.description, () => __awaiter(void 0, void 0, void 0, function* () {
                const signature = yield Ed25519.sign({
                    key: vector.input.key,
                    data: Convert.hex(vector.input.data).toUint8Array()
                });
                const signatureHex = Convert.uint8Array(signature).toHex();
                expect(signatureHex).to.deep.equal(vector.output);
            }));
        }
    });
    describe('validatePublicKey()', () => {
        it('returns true for valid public keys', () => __awaiter(void 0, void 0, void 0, function* () {
            const publicKey = Convert.hex('a12c2beb77265f2aac953b5009349d94155a03ada416aad451319480e983ca4c').toUint8Array();
            const isValid = yield Ed25519.validatePublicKey({ publicKey });
            expect(isValid).to.be.true;
        }));
        it('returns false for invalid public keys', () => __awaiter(void 0, void 0, void 0, function* () {
            const key = Convert.hex('02fffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f').toUint8Array();
            // @ts-expect-error because validatePublicKey() is a private method.
            const isValid = yield Ed25519.validatePublicKey({ key });
            expect(isValid).to.be.false;
        }));
        it('returns false if a private key is given', () => __awaiter(void 0, void 0, void 0, function* () {
            const key = Convert.hex('0a23a20072891237aa0864b5765139514908787878cd77135a0059881d313f00').toUint8Array();
            // @ts-expect-error because validatePublicKey() is a private method.
            const isValid = yield Ed25519.validatePublicKey({ key });
            expect(isValid).to.be.false;
        }));
    });
    describe('verify()', () => {
        it('returns a boolean result', () => __awaiter(void 0, void 0, void 0, function* () {
            const data = new Uint8Array([51, 52, 53]);
            const signature = yield Ed25519.sign({ key: privateKey, data });
            const isValid = yield Ed25519.verify({ key: publicKey, signature, data });
            expect(isValid).to.exist;
            expect(isValid).to.be.a('boolean');
        }));
        it('accepts input data as Uint8Array', () => __awaiter(void 0, void 0, void 0, function* () {
            const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
            const signature = yield Ed25519.sign({ key: privateKey, data });
            const isValid = yield Ed25519.verify({ key: publicKey, signature, data });
            expect(isValid).to.be.true;
        }));
        it('returns false if the signed data was mutated', () => __awaiter(void 0, void 0, void 0, function* () {
            const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
            let isValid;
            // Generate signature using the private key.
            const signature = yield Ed25519.sign({ key: privateKey, data });
            // Verification should return true with the data used to generate the signature.
            isValid = yield Ed25519.verify({ key: publicKey, signature, data });
            expect(isValid).to.be.true;
            // Make a copy and flip the least significant bit (the rightmost bit) in the first byte of the array.
            const mutatedData = new Uint8Array(data);
            mutatedData[0] ^= 1 << 0;
            // Verification should return false if the given data does not match the data used to generate the signature.
            isValid = yield Ed25519.verify({ key: publicKey, signature, data: mutatedData });
            expect(isValid).to.be.false;
        }));
        it('returns false if the signature was mutated', () => __awaiter(void 0, void 0, void 0, function* () {
            const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
            let isValid;
            // Generate a new private key and get its public key.
            privateKey = yield Ed25519.generateKey();
            publicKey = yield Ed25519.computePublicKey({ key: privateKey });
            // Generate signature using the private key.
            const signature = yield Ed25519.sign({ key: privateKey, data });
            // Make a copy and flip the least significant bit (the rightmost bit) in the first byte of the array.
            const mutatedSignature = new Uint8Array(signature);
            mutatedSignature[0] ^= 1 << 0;
            // Verification should return false if the signature was modified.
            isValid = yield Ed25519.verify({ key: publicKey, signature: signature, data: mutatedSignature });
            expect(isValid).to.be.false;
        }));
        it('returns false with a signature generated using a different private key', () => __awaiter(void 0, void 0, void 0, function* () {
            const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
            const privateKeyA = yield Ed25519.generateKey();
            const publicKeyA = yield Ed25519.computePublicKey({ key: privateKeyA });
            const privateKeyB = yield Ed25519.generateKey();
            let isValid;
            // Generate a signature using private key B.
            const signatureB = yield Ed25519.sign({ key: privateKeyB, data });
            // Verification should return false with the public key from private key A.
            isValid = yield Ed25519.verify({ key: publicKeyA, signature: signatureB, data });
            expect(isValid).to.be.false;
        }));
        for (const vector of ed25519Verify.vectors) {
            it(vector.description, () => __awaiter(void 0, void 0, void 0, function* () {
                const isValid = yield Ed25519.verify({
                    key: vector.input.key,
                    signature: Convert.hex(vector.input.signature).toUint8Array(),
                    data: Convert.hex(vector.input.data).toUint8Array()
                });
                expect(isValid).to.equal(vector.output);
            }));
        }
    });
});
//# sourceMappingURL=ed25519.spec.js.map