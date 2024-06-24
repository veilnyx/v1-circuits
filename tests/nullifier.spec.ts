import { Point, poseidonHash } from '@zkfi-tech/babyjubjub';
import { expectEqFe, getCircuit, randomHex } from './helpers';
import { randomBigInt } from '@zkfi-tech/utils';

describe('nullifier', function () {
  this.timeout(8000);

  it('correctly calculates nullifier', async function () {
    const circuit = await getCircuit('nullifier');

    const pathIndices = randomBigInt(8);
    const viewPrivateKey = randomBigInt(31);
    const commitment = randomBigInt(31);
    const revokerPublicKey = Point.generate(randomBigInt(31));

    const inputs = {
      pathIndices,
      viewPrivateKey,
      commitment,
      revokerPublicKey: revokerPublicKey.toArray(),
    };

    const nullifier = poseidonHash([
      pathIndices,
      commitment,
      revokerPublicKey.mul(viewPrivateKey).x,
    ]);

    const witness = await circuit.calculateWitness(inputs);

    expectEqFe(witness[1], nullifier);

    await circuit.checkConstraints(witness);
  });
});
