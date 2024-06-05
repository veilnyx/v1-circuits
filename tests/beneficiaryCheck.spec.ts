import { assert } from 'chai';
import { poseidonHash } from '@zkfi-tech/babyjubjub';
import { getCircuit, randomHex } from './helpers';
import { MSG_ASSERT_FAILED } from './helpers';

describe('beneficiaryCheck', function () {
  it('correctly check beneficiary', async function () {
    const circuit = await getCircuit('beneficiaryCheck');
    const address = randomHex(31);
    const revokerPublicKey = [randomHex(31), randomHex(31)];
    const blinding = randomHex(31);
    const beneficiary = poseidonHash([address, revokerPublicKey[0], revokerPublicKey[1], blinding]);
    const inputs = { address, revokerPublicKey, blinding, beneficiary };

    const witness = await circuit.calculateWitness(inputs, true);
    await circuit.checkConstraints(witness);
  });

  it('fails for incorrect calculation of beneficiary', async function () {
    const circuit = await getCircuit('beneficiaryCheck');
    const address = randomHex(31);
    const revokerPublicKey = [randomHex(31), randomHex(31)];
    const blinding = randomHex(31);
    const beneficiary = poseidonHash([address, revokerPublicKey[0], revokerPublicKey[1], blinding]);
    const inputs = { address, revokerPublicKey, blinding: randomHex(31), beneficiary };

    await assert.isRejected(circuit.calculateWitness(inputs, true), MSG_ASSERT_FAILED);
  });
});
