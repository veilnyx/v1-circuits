import { poseidonHash } from '@veilnyx-sdk/babyjubjub';
import { getCircuit } from './helpers';
import { randomBigInt } from '@veilnyx-sdk/utils';
import { expect } from 'chai';

describe('rootAddress', function () {
  it('correctly calculate address', async function () {
    const circuit = await getCircuit('rootAddress');
    const signPublicKey = [randomBigInt(31), randomBigInt(31)];
    const viewPrivateKey = randomBigInt(31);
    const rootAddress = poseidonHash([signPublicKey[0], signPublicKey[1], viewPrivateKey]);
    const inputs = { signPublicKey, viewPrivateKey };
    const witness = await circuit.calculateWitness(inputs, true);
    expect(witness[1]).to.equal(rootAddress);
    await circuit.checkConstraints(witness);
  });

  it('fails for incorrect calculation of address', async function () {
    const circuit = await getCircuit('rootAddress');
    const signPublicKey = [randomBigInt(31), randomBigInt(31)];
    const viewPrivateKey = randomBigInt(31);
    const rootAddress = poseidonHash([signPublicKey[0], signPublicKey[1], viewPrivateKey]);
    const inputs = { signPublicKey, viewPrivateKey: randomBigInt(31) };
    const witness = await circuit.calculateWitness(inputs, true);
    expect(witness[1]).to.not.equal(rootAddress);
  });
});
