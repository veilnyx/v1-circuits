import chai, { assert } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { randomBigInt } from '@zkfi-tech/utils';
import { MSG_ASSERT_FAILED, getCircuit } from './helpers';

chai.use(chaiAsPromised);

const n64 = randomBigInt(8);
const n128 = randomBigInt(16);
const n140 = randomBigInt(20);
const n192 = randomBigInt(24);
const n248 = randomBigInt(31);
const n256 = randomBigInt(32);

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
