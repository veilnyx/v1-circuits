import { assert } from 'chai';
import { slice, sliceHex } from 'viem';
import { Fr, Point, elGamal } from '@zkfi-tech/babyjubjub';
import { randomBigInt } from '@zkfi-tech/utils';
import { getCircuit } from './helpers';

describe('elGamal', () => {
  let circuit1;
  let circuit2;

  before(async function () {
    circuit1 = await getCircuit('elGamal');
    circuit2 = await getCircuit('elGamalMulti');
  });

  it('should verify encryption in circuit', async () => {
    const message = randomBigInt(31);
    const privateKey = BigInt(
      '196518003492553066139678792251928226250371319451207574335728467391529880337',
    );

    const encryptionPublicKey = Point.generate(privateKey);
    const ephemeralKey = randomBigInt(31);
    const ephemeralPublicKey = Point.generate(ephemeralKey);

    const ciphertext = elGamal.encrypt(message, encryptionPublicKey, ephemeralKey);

    const c = BigInt(sliceHex(ciphertext, 32, 64));
    const inputs = {
      ephemeralKey,
      ephemeralPublicKey: [ephemeralPublicKey.x, ephemeralPublicKey.y],
      encryptionPublicKey: [encryptionPublicKey.x, encryptionPublicKey.y],
      m: message,
      c,
    };

    await circuit1.calculateWitness(inputs, true);

    // await assert.isFulfilled(circuit1.calculateWitness(inputs, true));
  });

  it('should verify multi encryption in circuit', async () => {
    const messages = [randomBigInt(31), randomBigInt(31), randomBigInt(31)];
    const privateKey = Fr.random(31).toBigInt();
    const encryptionPublicKey = Point.generate(privateKey);
    const ephemeralKey = randomBigInt(31);
    const ephemeralPublicKey = Point.generate(ephemeralKey);
    const ciphertexts = messages.map((m) => elGamal.encrypt(m, encryptionPublicKey, ephemeralKey));
    const c = ciphertexts.map((c) => BigInt(slice(c, 32, 64)));

    const enabled = messages.map(() => 1);

    const inputs = {
      ephemeralKey,
      ephemeralPublicKey: [ephemeralPublicKey.x, ephemeralPublicKey.y],
      encryptionPublicKey: [encryptionPublicKey.x, encryptionPublicKey.y],
      m: messages,
      c,
      enabled,
    };

    await circuit2.calculateWitness(inputs, true);
    // await assert.isFulfilled(circuit2.calculateWitness(inputs, true));
  });
});
