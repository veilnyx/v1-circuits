import { poseidonHash } from '@zkfi-tech/babyjubjub';
import { expectEqFe, expectNeqFe, getCircuit, randomHex } from './helpers';

describe('stealthAddress', function () {
  it('correctly calculate stealth address', async function () {
    const circuit = await getCircuit('stealthAddress');
    const publicKey = [randomHex(31), randomHex(31)];
    const blinding = randomHex(31);
    const stealthAddress = poseidonHash([publicKey[0], publicKey[1], blinding]);
    const inputs = { publicKey, blinding };
    const witness = await circuit.calculateWitness(inputs, true);
    expectEqFe(witness[1], stealthAddress);
    await circuit.checkConstraints(witness);
  });

  it('fails for incorrect calculation of stealth address', async function () {
    const circuit = await getCircuit('stealthAddress');
    const publicKey = [randomHex(31), randomHex(31)];
    const blinding = randomHex(31);
    const stealthAddress = poseidonHash([publicKey[0], publicKey[1], blinding]);
    const inputs = { publicKey, blinding: randomHex(31) };
    const witness = await circuit.calculateWitness(inputs, true);
    expectNeqFe(witness[1], stealthAddress);
  });
});
