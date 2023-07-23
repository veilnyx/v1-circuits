import { expectEqFe, getCircuit, poseidonHash, randomHex } from './helpers';

describe('stealthAddress', function () {
  it('correctly calculate stealth address', async function () {
    const circuit = await getCircuit('stealthAddress');
    const publicKey = [randomHex(31), randomHex(31)];
    const stealthSeed = randomHex(31);
    const stealthAddress = poseidonHash(publicKey[0], publicKey[1], stealthSeed);
    const inputs = { publicKey, stealthSeed };
    const witness = await circuit.calculateWitness(inputs, true);
    expectEqFe(witness[1], stealthAddress);
    await circuit.checkConstraints(witness);
  });
});
