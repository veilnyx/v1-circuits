import { poseidonHash } from '@zkfi-tech/babyjubjub';
import { expectEqFe, getCircuit, randomHex } from './helpers';

describe('nullifier', function () {
  this.timeout(8000);

  it('correctly calculates nullifier', async function () {
    const circuit = await getCircuit('nullifier');

    const pathIndices = 5;
    const commitment = poseidonHash(randomHex(32));
    const blinding = randomHex(31);

    const inputs = {
      pathIndices,
      commitment,
      blinding,
    };

    const nullifier = poseidonHash([pathIndices, commitment, blinding]);

    const witness = await circuit.calculateWitness(inputs);

    expectEqFe(witness[1], nullifier);

    await circuit.checkConstraints(witness);
  });
});
