import { assert } from 'chai';
import { utils } from 'ethers';
import { getCircuit } from './helpers';

const eth = (n: number) => utils.parseEther(`${n}`).toHexString();

describe('zeroSum', function () {
  let circuit;

  before(async function () {
    circuit = await getCircuit('zeroSum');
  });

  it('should allow correct zero sum', async function () {
    const inputs1 = {
      inValue: [4, 0, 0, 0].map(eth),
      inPublicValue: eth(0),
      outValue: [0, 0].map(eth),
      outPublicValue: eth(4),
    };

    const inputs2 = {
      inValue: [4, 0, 3, 0].map(eth),
      inPublicValue: eth(0),
      outValue: [5.5, 0].map(eth),
      outPublicValue: eth(1.5),
    };

    const inputs3 = {
      inValue: [4, 2, 3, 8].map(eth),
      inPublicValue: eth(0),
      outValue: [15.1, 1.9].map(eth),
      outPublicValue: eth(0),
    };

    const inputs4 = {
      inValue: [0, 0, 0, 0].map(eth),
      inPublicValue: eth(30.5),
      outValue: [30.5, 0].map(eth),
      outPublicValue: eth(0),
    };

    await assert.isFulfilled(circuit.calculateWitness(inputs1, true));
    await assert.isFulfilled(circuit.calculateWitness(inputs2, true));
    await assert.isFulfilled(circuit.calculateWitness(inputs3, true));
    await assert.isFulfilled(circuit.calculateWitness(inputs4, true));

    const witness = await circuit.calculateWitness(inputs1, true);
    await circuit.checkConstraints(witness);
  });

  it('should fail for incorrect zero sum', async function () {
    const inputs1 = {
      inValue: [4, 0, 0, 0].map(eth),
      inPublicValue: eth(0),
      outValue: [0, 0].map(eth),
      outPublicValue: eth(5),
    };

    const inputs2 = {
      inValue: [4, 0, 3, 0].map(eth),
      inPublicValue: eth(0),
      outValue: [7, 0].map(eth),
      outPublicValue: eth(1.5),
    };

    const inputs3 = {
      inValue: [4, 2, 3, 8].map(eth),
      inPublicValue: eth(0),
      outValue: [15.1, 2].map(eth),
      outPublicValue: eth(0),
    };

    const inputs4 = {
      inValue: [0, 0, 0, 0].map(eth),
      inPublicValue: eth(30.5),
      outValue: [31, 0].map(eth),
      outPublicValue: eth(0),
    };

    await assert.isRejected(circuit.calculateWitness(inputs1, true), Error);
    await assert.isRejected(circuit.calculateWitness(inputs2, true), Error);
    await assert.isRejected(circuit.calculateWitness(inputs3, true), Error);
    await assert.isRejected(circuit.calculateWitness(inputs4, true), Error);
  });
});
