import { assert } from 'chai';
import { getCircuit } from './helpers';

const token1 = 0x010001;
const token2 = 0x010002;
const token3 = 0x010003;
const nft1 = 0x020004;
const nft2 = 0x020005;

describe('zeroSumNonFungible', function () {
  let circuit;

  before(async function () {
    circuit = await getCircuit('zeroSumNonFungible4I4O');
  });

  it('should check zero sum for non-fungible asset', async function () {
    const inputs = {
      pubFlow: 0,
      assetId: nft1,
      nftId: 4,
      inAssetIds: [nft1, token1, token1, token1],
      inValues: [4, 0, 0, 0],
      outAssetIds: [token1, nft1, token1, token1],
      outValues: [2, 4, 2, 0],
      pubAssetIds: [token1, nft1, token1, token1],
      pubValues: [0, 0, 2, 0],
    };

    await assert.isFulfilled(circuit.calculateWitness(inputs, true));
    const witness = await circuit.calculateWitness(inputs, true);
    await circuit.checkConstraints(witness);
  });

  it('should check zero sum only for given non-fungible asset', async function () {
    const inputs = {
      pubFlow: 0,
      assetId: nft1,
      nftId: 4,
      inAssetIds: [nft1, nft2, token1, token2],
      inValues: [4, 0, 0, 0],
      outAssetIds: [nft2, nft1, token1, token2],
      outValues: [0, 4, 4, 0],
      pubAssetIds: [nft2, nft1, token1, token2],
      pubValues: [0, 0, 2, 0],
    };

    await assert.isFulfilled(circuit.calculateWitness(inputs, true));
    const witness = await circuit.calculateWitness(inputs, true);
    await circuit.checkConstraints(witness);
  });

  it('should ignore zero sum check for fungible asset', async function () {
    const inputs = {
      pubFlow: 0,
      assetId: token1,
      nftId: 4,
      inAssetIds: [nft1, nft1, token1, nft1],
      inValues: [4, 0, 3, 0],
      outAssetIds: [nft1, token1, nft1, nft1],
      outValues: [98, 3, 2, 0],
      pubAssetIds: [nft1, token1, nft1, nft1],
      pubValues: [0, 3, 2, 0],
    };

    await assert.isFulfilled(circuit.calculateWitness(inputs, true));
    const witness = await circuit.calculateWitness(inputs, true);
    await circuit.checkConstraints(witness);
  });

  it('should check zero sum for public out-flow (withdraw)', async function () {
    const inputs = {
      pubFlow: 1,
      assetId: nft1,
      nftId: 5,
      inAssetIds: [nft1, token1, nft2, token2],
      inValues: [5, 10, 0, 0],
      outAssetIds: [token1, token1, token1, nft1],
      outValues: [0, 2, 2, 0],
      pubAssetIds: [token1, token1, token1, nft1],
      pubValues: [5, 0, 8, 5],
    };

    await assert.isFulfilled(circuit.calculateWitness(inputs, true));
    const witness = await circuit.calculateWitness(inputs, true);
    await circuit.checkConstraints(witness);
  });

  it('should fail zero sum check for incorrect values', async function () {
    const inputs = {
      pubFlow: 0,
      assetId: nft1,
      nftId: 4,
      inAssetIds: [nft1, token1, nft2, token3],
      inValues: [4, 0, 4, 0],
      outAssetIds: [nft1, token1, token3, token2],
      outValues: [4, 2, 2, 0],
      pubAssetIds: [nft1, token1, token3, token2],
      pubValues: [0, 0, 0, 0],
    };
    await assert.isFulfilled(circuit.calculateWitness(inputs, true));

    // Losing value
    const inputs1 = {
      ...inputs,
      outValues: [0, 1, 2, 0],
    };
    await assert.isRejected(circuit.calculateWitness(inputs1, true), Error);

    // Gaining value
    const inputs2 = {
      ...inputs,
      pubValues: [4, 3, 2, 0],
    };
    await assert.isRejected(circuit.calculateWitness(inputs2, true), Error);
  });

  it('should fail zero sum check for incorrect values with negative flow', async function () {
    const inputs = {
      pubFlow: 0,
      assetId: nft1,
      nftId: 4,
      inAssetIds: [nft1, token1, nft2, token3],
      inValues: [4, 0, 4, 0],
      outAssetIds: [nft1, token1, token3, token2],
      outValues: [4, 2, 2, 0],
      pubAssetIds: [nft1, token1, token3, token2],
      pubValues: [0, 0, 0, 0],
    };
    await assert.isFulfilled(circuit.calculateWitness(inputs, true));

    // Losing value
    const inputs1 = {
      ...inputs,
      outValues: [0, 1, 2, 0],
    };
    await assert.isRejected(circuit.calculateWitness(inputs1, true), Error);

    // Gaining value
    const inputs2 = {
      ...inputs,
      pubValues: [4, 3, 2, 0],
    };
    await assert.isRejected(circuit.calculateWitness(inputs2, true), Error);
  });
});
