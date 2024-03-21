import { expect } from 'chai';
import { slice } from 'viem';
import { Point, elGamal } from '@zkfi-tech/babyjubjub';
import { randomBigInt } from '@zkfi-tech/utils';
import { HexString } from '@zkfi-tech/shared-types';
import { encodeAsset } from './helpers/asset';
import { getCircuit } from './helpers';

const t1 = '0x010001';
const t2 = '0x010002';
const t3 = '0x020000';
const t4 = '0x020001';

describe('complianceProof', function () {
  let circuit;
  let encPubKey;
  let ephKey;
  let ephPubKey;

  before(async function () {
    circuit = await getCircuit('complianceProof');
    encPubKey = Point.generate(randomBigInt(31));
    ephKey = randomBigInt(31);
    ephPubKey = Point.generate(ephKey);
  });

  it('should verify for correct compliance inputs', async function () {
    const assetIds = [t1, t1, t2, t3];
    const values = assetIds.map((_) => randomBigInt(16));
    const blindings = assetIds.map((_) => randomBigInt(31));
    const publicKeyXs = assetIds.map((_) => randomBigInt(31));
    const assets = values.map((v, i) => encodeAsset(assetIds[i] as HexString, v));

    const encAssets = assets.map((a) => {
      const ciphertext = elGamal.encrypt(a, encPubKey, ephKey);
      const c1Packed_ = BigInt(slice(ciphertext, 0, 32));
      const c2 = BigInt(slice(ciphertext, 32, 64));
      const c1 = Point.unpack(c1Packed_);
      expect(c1.eq(ephPubKey)).to.be.true;
      return c2;
    });

    const encBlindings = blindings.map((b) => {
      const ciphertext = elGamal.encrypt(b, encPubKey, ephKey);
      const c1Packed_ = BigInt(slice(ciphertext, 0, 32));
      const c2 = BigInt(slice(ciphertext, 32, 64));
      const c1 = Point.unpack(c1Packed_);
      expect(c1.eq(ephPubKey)).to.be.true;
      return c2;
    });

    const encPublicKeyXs = publicKeyXs.map((x) => {
      const ciphertext = elGamal.encrypt(x, encPubKey, ephKey);
      const c1Packed_ = BigInt(slice(ciphertext, 0, 32));
      const c2 = BigInt(slice(ciphertext, 32, 64));
      const c1 = Point.unpack(c1Packed_);
      expect(c1.eq(ephPubKey)).to.be.true;
      return c2;
    });

    const inputs = {
      ephKey,
      ephPubKey: [ephPubKey.x, ephPubKey.y],
      encPubKey: [encPubKey.x, encPubKey.y],
      assetIds,
      values,
      publicKeyXs,
      blindings,
      encAssets,
      encBlindings,
      encPublicKeyXs,
    };

    const witness = await circuit.calculateWitness(inputs);
    await circuit.checkConstraints(witness);
  });
});
