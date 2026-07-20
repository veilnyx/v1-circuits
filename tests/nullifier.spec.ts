import { expect } from 'chai';
import { randomBigInt } from '@veilnyx-sdk/utils';
import { Point, poseidonHash } from '@veilnyx-sdk/babyjubjub';
import { getCircuit,
  pointToArray,
} from './helpers';

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
      revokerPublicKey: pointToArray(revokerPublicKey),
    };

    const nullifier = poseidonHash([
      pathIndices,
      commitment,
      revokerPublicKey.multiply(viewPrivateKey).x,
    ]);

    const witness = await circuit.calculateWitness(inputs);
    expect(witness[1]).to.equal(nullifier);

    await circuit.checkConstraints(witness);
  });
});
