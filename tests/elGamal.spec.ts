import { expect } from 'chai';
import { bytesToBigInt, slice, toBytes } from 'viem';
import { Fr, Point } from '@zkfi-tech/babyjubjub';
import { randomBigInt } from '@zkfi-tech/utils';
import { getCircuit } from './helpers';
import elGamal from './helpers/elGamal';

describe('elGamal', () => {
  let circuit1;
  let circuit2;

  before(async function () {
    circuit1 = await getCircuit('elGamal');
    circuit2 = await getCircuit('elGamalMulti');
  });

  it('should encrypt and decrypt', () => {
    const msg = randomBigInt(31);
    const privateKey = Fr.random(31).toBigInt();
    const publicKey = Point.generate(privateKey);
    const ciphertext = elGamal.encrypt(msg, publicKey);
    const decrypted = elGamal.decrypt(ciphertext, privateKey);
    expect(decrypted).to.equal(msg);
  });

  it('should verify encryption in circuit', async () => {
    const message = randomBigInt(31);
    const privateKey = Fr.random(31).toBigInt();
    const publicKey = Point.generate(privateKey);
    const r = Fr.random(31).toBigInt();
    const ciphertext = elGamal.encrypt(message, publicKey, r);

    const c1Packed = BigInt(slice(ciphertext, 0, 32));
    const c2 = BigInt(slice(ciphertext, 32, 64));

    // Note: circuit expects c1Packed to be in big endian order whereas, Point.pack()
    // returns it in little endian order
    const c1PackedR = bytesToBigInt(toBytes(c1Packed).reverse());

    const inputs = {
      r,
      m: message,
      publicKey: [publicKey.x, publicKey.y],
      c1Packed: c1PackedR,
      c2,
    };

    const witness = await circuit1.calculateWitness(inputs, true);
  });

  it('should verify multi encryption in circuit', async () => {
    const messages = [randomBigInt(31), randomBigInt(31), randomBigInt(31)];
    const privateKey = Fr.random(31).toBigInt();
    const publicKey = Point.generate(privateKey);
    const r = Fr.random(31).toBigInt();
    const ciphertexts = messages.map((m) => elGamal.encrypt(m, publicKey, r));

    const c1Packed = BigInt(slice(ciphertexts[0], 0, 32));
    const c2s = ciphertexts.map((c) => BigInt(slice(c, 32, 64)));

    // Note: circuit expects c1Packed to be in big endian order whereas, Point.pack()
    // returns it in little endian order
    const c1PackedR = bytesToBigInt(toBytes(c1Packed).reverse());

    const inputs = {
      r,
      m: messages,
      publicKey: [publicKey.x, publicKey.y],
      c1Packed: c1PackedR,
      c2: c2s,
    };

    const witness = await circuit2.calculateWitness(inputs, true);
  });
});
