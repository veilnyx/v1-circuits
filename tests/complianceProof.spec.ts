import { expect } from 'chai';
import { padHex, slice, sliceHex, zeroHash } from 'viem';
import { Point, elGamal, poseidonHash } from '@zkfi-tech/babyjubjub';
import { randomBigInt, randomHex } from '@zkfi-tech/utils';
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
    const inPublicKey = Point.generate(randomBigInt(31)).toArray();
    const viewPrivateKey = randomHex(31);
    const inAddress = poseidonHash([inPublicKey[0], inPublicKey[1], viewPrivateKey]);
    const beneficiaryBlinding = randomBigInt(31);
    const beneficiary = poseidonHash([inPublicKey[0], inPublicKey[1], beneficiaryBlinding]);

    const outAssetIds = [t1, t1, t2, t3];
    const outValues = outAssetIds.map((_) => randomBigInt(16));
    const outBlindings = outAssetIds.map((_) => randomBigInt(31));
    const outAddresses = outAssetIds.map((_) => randomBigInt(31));
    const outAssets = outValues.map((v, i) => encodeAsset(outAssetIds[i] as HexString, v));

    const encInAddress = BigInt(sliceHex(elGamal.encrypt(inAddress, encPubKey, ephKey), 32, 64));
    const encBeneficiaryBlinding = BigInt(
      sliceHex(elGamal.encrypt(beneficiaryBlinding, encPubKey, ephKey), 32, 64),
    );

    const encOutAssets = outAssets.map((a) => {
      const ciphertext = elGamal.encrypt(a, encPubKey, ephKey);
      const c1Packed_ = BigInt(slice(ciphertext, 0, 32));
      const c2 = BigInt(slice(ciphertext, 32, 64));
      const c1 = Point.unpack(c1Packed_);
      expect(c1.eq(ephPubKey)).to.be.true;
      return c2;
    });

    const encOutBlindings = outBlindings.map((b) => {
      const ciphertext = elGamal.encrypt(b, encPubKey, ephKey);
      const c1Packed_ = BigInt(slice(ciphertext, 0, 32));
      const c2 = BigInt(slice(ciphertext, 32, 64));
      const c1 = Point.unpack(c1Packed_);
      expect(c1.eq(ephPubKey)).to.be.true;
      return c2;
    });

    const encOutAddresses = outAddresses.map((x) => {
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
      inAddress,
      beneficiary,
      beneficiaryBlinding,
      outAssetIds,
      outValues,
      outAddresses,
      outBlindings,
      encInAddress,
      encBeneficiaryBlinding,
      encOutAssets,
      encOutBlindings,
      encOutAddresses,
    };

    const witness = await circuit.calculateWitness(inputs);
    await circuit.checkConstraints(witness);
  });

  it('should skip beneficiary blinding encryption check if blinding is zero', async function () {
    const inPublicKey = Point.generate(randomBigInt(31)).toArray();
    const viewPrivateKey = randomHex(31);
    const inAddress = poseidonHash([inPublicKey[0], inPublicKey[1], viewPrivateKey]);
    const beneficiaryBlinding = randomBigInt(31);
    const beneficiary = zeroHash;

    const outAssetIds = [t1, t1, t2, t3];
    const outValues = outAssetIds.map((_) => randomBigInt(16));
    const outBlindings = outAssetIds.map((_) => randomBigInt(31));
    const outAddresses = outAssetIds.map((_) => randomBigInt(31));
    const outAssets = outValues.map((v, i) => encodeAsset(outAssetIds[i] as HexString, v));

    const encInAddress = BigInt(sliceHex(elGamal.encrypt(inAddress, encPubKey, ephKey), 32, 64));
    const encBeneficiaryBlinding = padHex('0x00', { size: 32 });

    const encOutAssets = outAssets.map((a) => {
      const ciphertext = elGamal.encrypt(a, encPubKey, ephKey);
      const c1Packed_ = BigInt(slice(ciphertext, 0, 32));
      const c2 = BigInt(slice(ciphertext, 32, 64));
      const c1 = Point.unpack(c1Packed_);
      expect(c1.eq(ephPubKey)).to.be.true;
      return c2;
    });

    const encOutBlindings = outBlindings.map((b) => {
      const ciphertext = elGamal.encrypt(b, encPubKey, ephKey);
      const c1Packed_ = BigInt(slice(ciphertext, 0, 32));
      const c2 = BigInt(slice(ciphertext, 32, 64));
      const c1 = Point.unpack(c1Packed_);
      expect(c1.eq(ephPubKey)).to.be.true;
      return c2;
    });

    const encOutAddresses = outAddresses.map((x) => {
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
      inAddress,
      beneficiary,
      beneficiaryBlinding,
      outAssetIds,
      outValues,
      outAddresses,
      outBlindings,
      encInAddress,
      encBeneficiaryBlinding,
      encOutAssets,
      encOutBlindings,
      encOutAddresses,
    };

    const witness = await circuit.calculateWitness(inputs);
    await circuit.checkConstraints(witness);
  });
});
