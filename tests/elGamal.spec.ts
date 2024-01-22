import { expect } from 'chai';
import { Fr, Point } from '@zkfi-tech/babyjubjub';
import { randomBigInt } from '@zkfi-tech/utils';
import { getCircuit } from './helpers';
import elGamal from './helpers/elGamal';
import { bytesToBigInt, slice, toBytes } from 'viem';

describe('elGamal', () => {
  let circuit;

  before(async function () {
    circuit = await getCircuit('elGamal');
  });

  it('should encrypt and decrypt', () => {
    const msg = randomBigInt(31);
    const privateKey = Fr.random(31).toBigInt();
    const publicKey = Point.generate(privateKey);
    const ciphertext = elGamal.encrypt(msg, publicKey);
    const decrypted = elGamal.decrypt(ciphertext, privateKey);
    expect(decrypted).to.equal(msg);
  });

  it('should encrypt and decrypt in circuit', async () => {
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

    const witness = await circuit.calculateWitness(inputs, true);
  });
});
