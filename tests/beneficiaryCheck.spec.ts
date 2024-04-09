import { assert } from 'chai';
import { poseidonHash } from '@zkfi-tech/babyjubjub';
import { getCircuit, randomHex } from './helpers';
import { MSG_ASSERT_FAILED } from './helpers';

describe('beneficiaryCheck', function () {
  it('correctly check beneficiary', async function () {
    const circuit = await getCircuit('beneficiaryCheck');
    const publicKey = [randomHex(31), randomHex(31)];
    const blinding = randomHex(31);
    const beneficiary = poseidonHash([publicKey[0], publicKey[1], blinding]);
    const inputs = { publicKey, beneficiary, blinding };
    const witness = await circuit.calculateWitness(inputs, true);
    await circuit.checkConstraints(witness);
  });

  it('fails for incorrect calculation of stealth address', async function () {
    const circuit = await getCircuit('beneficiaryCheck');
    const publicKey = [randomHex(31), randomHex(31)];
    const blinding = randomHex(31);
    const beneficiary = randomHex(31);
    const inputs = { publicKey, beneficiary, blinding };

    await assert.isRejected(circuit.calculateWitness(inputs, true), MSG_ASSERT_FAILED);
  });
});
