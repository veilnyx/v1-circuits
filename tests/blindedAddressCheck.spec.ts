import { assert } from 'chai';
import { poseidonHash } from '@zkfi-tech/babyjubjub';
import { getCircuit, randomHex } from './helpers';
import { MSG_ASSERT_FAILED } from './helpers';

describe('blindedAddressCheck', function () {
  it('correctly check blindedAddress', async function () {
    const circuit = await getCircuit('blindedAddressCheck');
    const rootAddress = randomHex(31);
    const revokerPublicKey = [randomHex(31), randomHex(31)];
    const blinding = randomHex(31);
    const blindedAddress = poseidonHash([
      rootAddress,
      revokerPublicKey[0],
      revokerPublicKey[1],
      blinding,
    ]);
    const inputs = { rootAddress, revokerPublicKey, blinding, blindedAddress };

    const witness = await circuit.calculateWitness(inputs, true);
    await circuit.checkConstraints(witness);
  });

  it('fails for incorrect calculation of beneficiary', async function () {
    const circuit = await getCircuit('blindedAddressCheck');
    const rootAddress = randomHex(31);
    const revokerPublicKey = [randomHex(31), randomHex(31)];
    const blinding = randomHex(31);
    const blindedAddress = poseidonHash([
      rootAddress,
      revokerPublicKey[0],
      revokerPublicKey[1],
      blinding,
    ]);
    const inputs = {
      rootAddress,
      revokerPublicKey,
      blinding: randomHex(31),
      blindedAddress,
    };

    await assert.isRejected(circuit.calculateWitness(inputs, true), MSG_ASSERT_FAILED);
  });
});
