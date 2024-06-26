import { assert } from 'chai';
import { poseidonHash } from '@zkfi-tech/babyjubjub';
import { getCircuit, randomHex } from './helpers';
import { MSG_ASSERT_FAILED } from './helpers';

describe('stealthAddressCheck', function () {
  it('correctly check stealthAddress', async function () {
    const circuit = await getCircuit('stealthAddressCheck');
    const address = randomHex(31);
    const revokerPublicKey = [randomHex(31), randomHex(31)];
    const blinding = randomHex(31);
    const stealthAddress = poseidonHash([
      address,
      revokerPublicKey[0],
      revokerPublicKey[1],
      blinding,
    ]);
    const inputs = { address, revokerPublicKey, blinding, stealthAddress };

    const witness = await circuit.calculateWitness(inputs, true);
    await circuit.checkConstraints(witness);
  });

  it('fails for incorrect calculation of beneficiary', async function () {
    const circuit = await getCircuit('stealthAddressCheck');
    const address = randomHex(31);
    const revokerPublicKey = [randomHex(31), randomHex(31)];
    const blinding = randomHex(31);
    const stealthAddress = poseidonHash([
      address,
      revokerPublicKey[0],
      revokerPublicKey[1],
      blinding,
    ]);
    const inputs = { address, revokerPublicKey, blinding: randomHex(31), stealthAddress };

    await assert.isRejected(circuit.calculateWitness(inputs, true), MSG_ASSERT_FAILED);
  });
});
