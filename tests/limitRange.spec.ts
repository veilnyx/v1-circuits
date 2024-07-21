import chai, { assert } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { MSG_ASSERT_FAILED, getCircuit, randomHex } from './helpers';

chai.use(chaiAsPromised);

const n64 = randomHex(8);
const n128 = randomHex(16);
const n140 = randomHex(20);
const n192 = randomHex(24);
const n248 = randomHex(31);
const n256 = randomHex(32);

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
