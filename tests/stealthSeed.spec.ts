import { expectEqFe, getCircuit, poseidonHash, randomHex } from './helpers';

describe('stealthSeed', function () {
  it('correctly calculate stealth seed', async function () {
    const circuit = await getCircuit('stealthSeed');
    const viewKey = randomHex(31);
    const stealthSeed = poseidonHash(viewKey);
    const inputs = { viewKey };
    const witness = await circuit.calculateWitness(inputs, true);
    expectEqFe(witness[1], stealthSeed);
    await circuit.checkConstraints(witness);
  });
});
