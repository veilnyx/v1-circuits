import { expect } from 'chai';
import { poseidonHash } from '@zkfi-tech/babyjubjub';
import { randomBigInt } from '@zkfi-tech/utils';
import { getCircuit } from './helpers';

describe('blindedAddress', function () {
  it('correctly calculate blinded address', async function () {
    const circuit = await getCircuit('blindedAddress');
    const rootAddress = randomBigInt(31);
    const revokerPublicKey = [randomBigInt(31), randomBigInt(31)];
    const blinding = randomBigInt(31);
    const blindedAddress = poseidonHash([
      rootAddress,
      revokerPublicKey[0],
      revokerPublicKey[1],
      blinding,
    ]);
    const inputs = { rootAddress, revokerPublicKey, blinding };
    const witness = await circuit.calculateWitness(inputs, true);
    expect(witness[1]).to.equal(blindedAddress);
    await circuit.checkConstraints(witness);
  });

  it('fails for incorrect calculation of blinded address', async function () {
    const circuit = await getCircuit('blindedAddress');
    const rootAddress = randomBigInt(31);
    const revokerPublicKey = [randomBigInt(31), randomBigInt(31)];
    const blinding = randomBigInt(31);
    const blindedAddress = poseidonHash([revokerPublicKey[0], revokerPublicKey[1], blinding]);
    const inputs = { rootAddress, revokerPublicKey, blinding: randomBigInt(31) };
    const witness = await circuit.calculateWitness(inputs, true);
    expect(witness[1]).to.not.equal(blindedAddress);
  });
});
