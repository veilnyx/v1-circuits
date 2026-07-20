import chai, { assert } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { randomBigInt } from '@veilnyx-sdk/utils';
import { MSG_ASSERT_FAILED, getCircuit } from './helpers';

chai.use(chaiAsPromised);

// In-range values are drawn randomly; out-of-range values are pinned to the smallest value
// above the bound, so the "should be rejected" cases can't draw an in-range number by chance.
const n64 = randomBigInt(8);
const n128 = randomBigInt(16);
const n140 = 1n << 139n;
const n192 = 1n << 191n;
const n248 = (1n << 248n) - 1n;
const n256 = 1n << 248n;

describe('limitRange', function () {
  it('limits max to 128 bits', async function () {
    const circuit = await getCircuit('limitRange128');

    await assert.isFulfilled(circuit.calculateWitness({ in: n64 }, true));
    await assert.isFulfilled(circuit.calculateWitness({ in: n128 }, true));
    await assert.isRejected(circuit.calculateWitness({ in: n140 }, true), MSG_ASSERT_FAILED);
    await assert.isRejected(circuit.calculateWitness({ in: n192 }, true), MSG_ASSERT_FAILED);
  });

  it('limits max to 248 bits', async function () {
    const circuit = await getCircuit('limitRange248');

    await assert.isFulfilled(circuit.calculateWitness({ in: n192 }, true));
    await assert.isFulfilled(circuit.calculateWitness({ in: n248 }, true));
    await assert.isRejected(circuit.calculateWitness({ in: n256 }, true), MSG_ASSERT_FAILED);
  });
});
