import { assert } from 'chai';
import { parseEther } from 'viem';
import { getCircuit } from './helpers';

const eth = (n: number) => parseEther(`${n}`);

const token1 = 0x010001;
const token2 = 0x010002;
const token3 = 0x010003;
const nft1 = 0x020004;
const nft2 = 0x020005;

describe('zeroSumFungible', function () {
  let circuit;

  before(async function () {
    circuit = await getCircuit('zeroSumFungible4I4O');
  });

  it('should check zero sum for fungible asset', async function () {
    const inputs = {
      pubFlow: 0,
      assetId: token1,
      inAssetIds: [token1, token1, token1, token1],
      inValues: [4, 0, 0, 0].map(eth),
      outAssetIds: [token1, token1, token1, token1],
      outValues: [2, 2, 2, 0].map(eth),
      pubAssetIds: [0, 0, token1, 0],
      pubValues: [0, 0, 2, 0].map(eth),
    };

    await assert.isFulfilled(circuit.calculateWitness(inputs, true));
    const witness = await circuit.calculateWitness(inputs, true);
    await circuit.checkConstraints(witness);
  });

  it('should check zero sum only for given fungible asset', async function () {
    const inputs = {
      pubFlow: 0,
      assetId: token1,
      inAssetIds: [token1, token2, token1, token2],
      inValues: [4, 0, 0, 0].map(eth),
      outAssetIds: [token1, token2, token2, token2],
      outValues: [6, 2, 4, 0].map(eth),
      pubAssetIds: [token2, 0, token1, 0],
      pubValues: [2, 0, 2, 0].map(eth),
    };

    await assert.isFulfilled(circuit.calculateWitness(inputs, true));
    const witness = await circuit.calculateWitness(inputs, true);
    await circuit.checkConstraints(witness);
  });

  it('should ignore zero sum check for non-fungible asset', async function () {
    const inputs = {
      pubFlow: 0,
      assetId: nft1,
      inAssetIds: [nft1, nft1, token1, nft1],
      inValues: [4, 0, 0, 0],
      outAssetIds: [nft1, token1, nft1, nft1],
      outValues: [98, 1, 2, 0],
      pubAssetIds: [0, 0, nft1, 0],
      pubValues: [0, 0, 2, 0],
    };

    await assert.isFulfilled(circuit.calculateWitness(inputs, true));
    const witness = await circuit.calculateWitness(inputs, true);
    await circuit.checkConstraints(witness);
  });

  it('should check zero sum without public value of checked asset', async function () {
    const inputs = {
      pubFlow: 0,
      assetId: token1,
      inAssetIds: [token1, token1, token2, token3],
      inValues: [4, 2, 0, 0].map(eth),
      outAssetIds: [token1, token1, token2, token3],
      outValues: [1, 5, 2, 0].map(eth),
      pubAssetIds: [token1, token1, token2, token3],
      pubValues: [0, 0, 4, 2].map(eth),
    };

    await assert.isFulfilled(circuit.calculateWitness(inputs, true));
    const witness = await circuit.calculateWitness(inputs, true);
    await circuit.checkConstraints(witness);
  });

  it('should check zero sum for negative public flow', async function () {
    const inputs = {
      pubFlow: 1,
      assetId: token1,
      inAssetIds: [token1, token1, token1, token1],
      inValues: [4, 10, 0, 0].map(eth),
      outAssetIds: [token1, token1, token1, token1],
      outValues: [2, 2, 2, 0].map(eth),
      pubAssetIds: [token1, token1, token1, token1],
      pubValues: [0, 0, 8, 0].map(eth),
    };

    await assert.isFulfilled(circuit.calculateWitness(inputs, true));
    const witness = await circuit.calculateWitness(inputs, true);
    await circuit.checkConstraints(witness);
  });

  it('should check zero sum for negative public flow for mixed assets', async function () {
    const inputs = {
      pubFlow: 1,
      assetId: token1,
      inAssetIds: [token1, token2, token3, token1],
      inValues: [4, 2, 3, 7].map(eth),
      outAssetIds: [token1, token1, token3, token2],
      outValues: [6, 0, 2, 0].map(eth),
      pubAssetIds: [token1, token1, token3, token2],
      pubValues: [5, 0, 8, 0].map(eth),
    };

    await assert.isFulfilled(circuit.calculateWitness(inputs, true));
    const witness = await circuit.calculateWitness(inputs, true);
    await circuit.checkConstraints(witness);
  });

  it('should fail zero sum check for incorrect values', async function () {
    const inputs = {
      pubFlow: 0,
      assetId: token1,
      inAssetIds: [token1, token1, token2, token3],
      inValues: [4, 0, 0, 0].map(eth),
      outAssetIds: [token1, token1, token3, token2],
      outValues: [2, 2, 2, 0].map(eth),
      pubAssetIds: [token1, token1, token3, token2],
      pubValues: [0, 0, 0, 0].map(eth),
    };
    await assert.isFulfilled(circuit.calculateWitness(inputs, true));

    // Losing value
    const inputs1 = {
      ...inputs,
      outValues: [2, 1, 2, 0].map(eth),
    };
    await assert.isRejected(circuit.calculateWitness(inputs1, true), Error);

    // Gaining value
    const inputs2 = {
      ...inputs,
      outValues: [2, 3, 2, 0].map(eth),
    };
    await assert.isRejected(circuit.calculateWitness(inputs2, true), Error);

    // Gaining public value
    const inputs3 = {
      ...inputs,
      pubValues: [1, 0, 0, 1].map(eth),
    };
    await assert.isRejected(circuit.calculateWitness(inputs3, true), Error);
  });

  it('should fail zero sum check for incorrect values with negative flow', async function () {
    const inputs = {
      pubFlow: 1,
      assetId: token1,
      inAssetIds: [token1, token1, token2, token3],
      inValues: [4, 3, 0, 0].map(eth),
      outAssetIds: [token1, token1, token3, token2],
      outValues: [6, 0, 2, 0].map(eth),
      pubAssetIds: [token1, token1, token3, token2],
      pubValues: [1, 0, 0, 0].map(eth),
    };
    await assert.isFulfilled(circuit.calculateWitness(inputs, true));

    // Losing value
    const inputs1 = {
      ...inputs,
      outValues: [5, 0, 2, 0].map(eth),
    };
    await assert.isRejected(circuit.calculateWitness(inputs1, true), Error);

    // Gaining value
    const inputs2 = {
      ...inputs,
      outValues: [4, 3, 2, 0].map(eth),
    };
    await assert.isRejected(circuit.calculateWitness(inputs2, true), Error);

    // Gaining public value
    const inputs3 = {
      ...inputs,
      pubValues: [2, 0, 0, 1].map(eth),
    };
    await assert.isRejected(circuit.calculateWitness(inputs3, true), Error);
  });
});
