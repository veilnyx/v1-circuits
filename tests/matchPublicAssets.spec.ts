import { assert } from 'chai';
import { getCircuit } from './helpers';

describe('matchPublicAssets', function () {
  let circuit;

  const t1 = 0x010001;
  const t2 = 0x010002;
  const t3 = 0x01ffff;
  const t4 = 0x020000;
  const t5 = 0x020001;

  before(async function () {
    circuit = await getCircuit('matchPublicAssets');
  });

  it('should correctly match legit public assets', async function () {
    const inputs1 = {
      publicAssetIds: [t1, t2, 0, 0, 0],
      outAssetIds: [t1, t2, t3, t4, t5],
    };
    const inputs2 = {
      publicAssetIds: [t1, 0, 0, t3, 0],
      outAssetIds: [t1, t2, t4, t3, t5],
    };

    await assert.isFulfilled(circuit.calculateWitness(inputs1, true));
    await assert.isFulfilled(circuit.calculateWitness(inputs2, true));
  });

  it('should fail for incorrect public assets', async function () {
    const inputs1 = {
      publicAssetIds: [t1, t2, 0, 0, 0],
      outAssetIds: [t1, t3, t3, t4, t5],
    };
    const inputs2 = {
      publicAssetIds: [t1, 0, t2, t3, 0],
      outAssetIds: [t1, t2, t4, t3, t5],
    };

    await assert.isRejected(circuit.calculateWitness(inputs1, true));
    await assert.isRejected(circuit.calculateWitness(inputs2, true));
  });
});
