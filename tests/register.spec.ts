import { assert } from 'chai';
import { Point } from '@zkfi-tech/babyjubjub';
import { randomBigInt } from '@zkfi-tech/utils';
import { getCircuit, MSG_ASSERT_FAILED, randomAccount } from './helpers';

describe('register', function () {
  it('successfully verify well-formed root address', async function () {
    const circuit = await getCircuit('register');
    const acc = randomAccount();

    const inputs = {
      rootAddress: acc.rootAddress,
      signPublicKey: acc.signer.publicKey.toArray(),
      viewPublicKey: acc.viewer.publicKey.toArray(),
      viewPrivateKey: acc.viewer.privateKey,
    };

    assert.isFulfilled(circuit.calculateWitness(inputs, true));
    const witness = await circuit.calculateWitness(inputs, true);
    await circuit.checkConstraints(witness);
  });

  it('fail verification for malformed root address', async function () {
    const circuit = await getCircuit('register');
    const acc = randomAccount();

    const inputs = {
      rootAddress: acc.rootAddress,
      signPublicKey: acc.signer.publicKey.toArray(),
      viewPublicKey: Point.generate(randomBigInt(31)).toArray(),
      viewPrivateKey: acc.viewer.privateKey,
    };

    assert.isRejected(circuit.calculateWitness(inputs, true), MSG_ASSERT_FAILED);
  });
});
