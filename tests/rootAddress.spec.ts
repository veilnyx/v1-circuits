import { poseidonHash } from '@zkfi-tech/babyjubjub';
import { expectEqFe, expectNeqFe, getCircuit, randomHex } from './helpers';

describe('rootAddress', function () {
  it('correctly calculate address', async function () {
    const circuit = await getCircuit('rootAddress');
    const signPublicKey = [randomHex(31), randomHex(31)];
    const viewPrivateKey = randomHex(31);
    const rootAddress = poseidonHash([signPublicKey[0], signPublicKey[1], viewPrivateKey]);
    const inputs = { signPublicKey, viewPrivateKey };
    const witness = await circuit.calculateWitness(inputs, true);
    expectEqFe(witness[1], rootAddress);
    await circuit.checkConstraints(witness);
  });

  it('fails for incorrect calculation of address', async function () {
    const circuit = await getCircuit('rootAddress');
    const signPublicKey = [randomHex(31), randomHex(31)];
    const viewPrivateKey = randomHex(31);
    const rootAddress = poseidonHash([signPublicKey[0], signPublicKey[1], viewPrivateKey]);
    const inputs = { signPublicKey, viewPrivateKey: randomHex(31) };
    const witness = await circuit.calculateWitness(inputs, true);
    expectNeqFe(witness[1], rootAddress);
  });
});
