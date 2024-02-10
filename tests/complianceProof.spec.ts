import { expect } from 'chai';
import { bytesToBigInt, slice, toBytes } from 'viem';
import { Point } from '@zkfi-tech/babyjubjub';
import { randomBigInt } from '@zkfi-tech/utils';
import { HexString } from '@zkfi-tech/shared-types';
import { encodeAsset } from './helpers/asset';
import { getCircuit } from './helpers';
import elGamal from './helpers/elGamal';

const t1 = '0x010001';
const t2 = '0x010002';
const t3 = '0x020000';
const t4 = '0x020001';

describe('complianceProof', function () {
  let circuit;
  let encPubKey;
  let ephKey;
  let ephPubKeyPacked;

  before(async function () {
    circuit = await getCircuit('complianceProof');
    encPubKey = Point.generate(randomBigInt(31));
    ephKey = randomBigInt(31);
    ephPubKeyPacked = Point.generate(ephKey).pack();
  });

  it('should verify for correct compliance inputs', async function () {
    const values = [randomBigInt(16), randomBigInt(16), randomBigInt(16), randomBigInt(16)];
    const assetIds = [t1, t1, t2, t3];
    const assets = values.map((v, i) => encodeAsset(assetIds[i] as HexString, v));
    const encAssets = assets.map((a) => {
      const ciphertext = elGamal.encrypt(a, encPubKey, ephKey);
      const c1Packed_ = BigInt(slice(ciphertext, 0, 32));
      const c2 = BigInt(slice(ciphertext, 32, 64));
      expect(c1Packed_).to.equal(BigInt(ephPubKeyPacked));
      return c2;
    });

    const inputs = {
      ephKey,
      ephPubKeyPacked: bytesToBigInt(toBytes(ephPubKeyPacked).reverse()),
      encPubKey: [encPubKey.x, encPubKey.y],
      assetIds,
      values,
      encAssets,
    };

    const witness = await circuit.calculateWitness(inputs);
    await circuit.checkConstraints(witness);
  });
});
