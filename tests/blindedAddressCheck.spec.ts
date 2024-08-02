import { assert } from 'chai';
import { Point, poseidonHash } from '@zkfi-tech/babyjubjub';
import { getCircuit, randomAccount } from './helpers';
import { MSG_ASSERT_FAILED } from './helpers';
import { randomBigInt } from '@zkfi-tech/utils';

describe('blindedAddressCheck', function () {
  it('correctly check blindedAddress', async function () {
    const circuit = await getCircuit('blindedAddressCheck');
    const acc = randomAccount();
    const rootAddress = acc.rootAddress;
    const revokerPublicKey = Point.generate(randomBigInt(31));
    const blinding = randomBigInt(31);
    const blindedAddress = poseidonHash([
      rootAddress,
      revokerPublicKey.x,
      revokerPublicKey.y,
      blinding,
    ]);
    const inputs = {
      rootAddress,
      revokerPublicKey: revokerPublicKey.toArray(),
      blinding,
      blindedAddress,
    };

    const witness = await circuit.calculateWitness(inputs, true);
    await circuit.checkConstraints(witness);
  });

  it('fails for incorrect calculation of beneficiary', async function () {
    const circuit = await getCircuit('blindedAddressCheck');
    const acc = randomAccount();
    const rootAddress = acc.rootAddress;
    const revokerPublicKey = Point.generate(randomBigInt(31));
    const blinding = randomBigInt(31);
    const blindedAddress = poseidonHash([
      rootAddress,
      revokerPublicKey.x,
      revokerPublicKey.y,
      blinding,
    ]);
    const inputs = {
      rootAddress,
      revokerPublicKey: revokerPublicKey.toArray(),
      blinding: randomBigInt(31),
      blindedAddress,
    };

    await assert.isRejected(circuit.calculateWitness(inputs, true), MSG_ASSERT_FAILED);
  });
});
