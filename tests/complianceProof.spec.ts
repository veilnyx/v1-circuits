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
  let encryptionPublicKey;
  let ephemeralKey;
  let ephemeralPublicKey;

  before(async function () {
    circuit = await getCircuit('complianceProof');
    encryptionPublicKey = Point.generate(randomBigInt(31));
    ephemeralKey = randomBigInt(31);
    ephemeralPublicKey = Point.generate(ephemeralKey);
  });

  it('should verify for correct compliance inputs', async function () {
    const inPublicKey = Point.generate(randomBigInt(31)).toArray();
    const viewPrivateKey = randomHex(31);
    const inRootAddress = poseidonHash([inPublicKey[0], inPublicKey[1], viewPrivateKey]);
    const refundAddressBlinding = randomBigInt(31);
    const refundAddress = poseidonHash([inPublicKey[0], inPublicKey[1], refundAddressBlinding]);

    const outAssetIds = [t1, t1, t2, t3];
    const outValues = outAssetIds.map((_) => randomBigInt(16));
    const outBlindings = outAssetIds.map((_) => randomBigInt(31));
    const outRootAddresses = outAssetIds.map((_) => randomBigInt(31));
    const outAssets = outValues.map((v, i) => encodeAsset(outAssetIds[i] as HexString, v));

    const encryptedInRootAddress = BigInt(
      sliceHex(elGamal.encrypt(inRootAddress, encryptionPublicKey, ephemeralKey), 32, 64),
    );
    const encryptedRefundAddressBlinding = BigInt(
      sliceHex(elGamal.encrypt(refundAddressBlinding, encryptionPublicKey, ephemeralKey), 32, 64),
    );

    const encryptedOutAssets = outAssets.map((a) => {
      const ciphertext = elGamal.encrypt(a, encryptionPublicKey, ephemeralKey);
      const c1Packed_ = BigInt(slice(ciphertext, 0, 32));
      const c2 = BigInt(slice(ciphertext, 32, 64));
      const c1 = Point.unpack(c1Packed_);
      expect(c1.eq(ephemeralPublicKey)).to.be.true;
      return c2;
    });

    const encryptedOutBlindings = outBlindings.map((b) => {
      const ciphertext = elGamal.encrypt(b, encryptionPublicKey, ephemeralKey);
      const c1Packed_ = BigInt(slice(ciphertext, 0, 32));
      const c2 = BigInt(slice(ciphertext, 32, 64));
      const c1 = Point.unpack(c1Packed_);
      expect(c1.eq(ephemeralPublicKey)).to.be.true;
      return c2;
    });

    const encryptedOutRootAddresses = outRootAddresses.map((x) => {
      const ciphertext = elGamal.encrypt(x, encryptionPublicKey, ephemeralKey);
      const c1Packed_ = BigInt(slice(ciphertext, 0, 32));
      const c2 = BigInt(slice(ciphertext, 32, 64));
      const c1 = Point.unpack(c1Packed_);
      expect(c1.eq(ephemeralPublicKey)).to.be.true;
      return c2;
    });

    const inputs = {
      ephemeralKey,
      ephemeralPublicKey: [ephemeralPublicKey.x, ephemeralPublicKey.y],
      encryptionPublicKey: [encryptionPublicKey.x, encryptionPublicKey.y],
      inRootAddress,
      refundAddress,
      refundAddressBlinding,
      outAssetIds,
      outValues,
      outRootAddresses,
      outBlindings,
      encryptedInRootAddress,
      encryptedRefundAddressBlinding,
      encryptedOutAssets,
      encryptedOutBlindings,
      encryptedOutRootAddresses,
    };

    const witness = await circuit.calculateWitness(inputs);
    await circuit.checkConstraints(witness);
  });

  it('should skip beneficiary blinding encryption check if blinding is zero', async function () {
    const inPublicKey = Point.generate(randomBigInt(31)).toArray();
    const viewPrivateKey = randomHex(31);
    const inRootAddress = poseidonHash([inPublicKey[0], inPublicKey[1], viewPrivateKey]);
    const refundAddressBlinding = randomBigInt(31);
    const refundAddress = zeroHash;

    const outAssetIds = [t1, t1, t2, t3];
    const outValues = outAssetIds.map((_) => randomBigInt(16));
    const outBlindings = outAssetIds.map((_) => randomBigInt(31));
    const outRootAddresses = outAssetIds.map((_) => randomBigInt(31));
    const outAssets = outValues.map((v, i) => encodeAsset(outAssetIds[i] as HexString, v));

    const encryptedInRootAddress = BigInt(
      sliceHex(elGamal.encrypt(inRootAddress, encryptionPublicKey, ephemeralKey), 32, 64),
    );
    const encryptedRefundAddressBlinding = padHex('0x00', { size: 32 });

    const encryptedOutAssets = outAssets.map((a) => {
      const ciphertext = elGamal.encrypt(a, encryptionPublicKey, ephemeralKey);
      const c1Packed_ = BigInt(slice(ciphertext, 0, 32));
      const c2 = BigInt(slice(ciphertext, 32, 64));
      const c1 = Point.unpack(c1Packed_);
      expect(c1.eq(ephemeralPublicKey)).to.be.true;
      return c2;
    });

    const encryptedOutBlindings = outBlindings.map((b) => {
      const ciphertext = elGamal.encrypt(b, encryptionPublicKey, ephemeralKey);
      const c1Packed_ = BigInt(slice(ciphertext, 0, 32));
      const c2 = BigInt(slice(ciphertext, 32, 64));
      const c1 = Point.unpack(c1Packed_);
      expect(c1.eq(ephemeralPublicKey)).to.be.true;
      return c2;
    });

    const encryptedOutRootAddresses = outRootAddresses.map((x) => {
      const ciphertext = elGamal.encrypt(x, encryptionPublicKey, ephemeralKey);
      const c1Packed_ = BigInt(slice(ciphertext, 0, 32));
      const c2 = BigInt(slice(ciphertext, 32, 64));
      const c1 = Point.unpack(c1Packed_);
      expect(c1.eq(ephemeralPublicKey)).to.be.true;
      return c2;
    });

    const inputs = {
      ephemeralKey,
      ephemeralPublicKey: [ephemeralPublicKey.x, ephemeralPublicKey.y],
      encryptionPublicKey: [encryptionPublicKey.x, encryptionPublicKey.y],
      inRootAddress,
      refundAddress,
      refundAddressBlinding,
      outAssetIds,
      outValues,
      outRootAddresses,
      outBlindings,
      encryptedInRootAddress,
      encryptedRefundAddressBlinding,
      encryptedOutAssets,
      encryptedOutBlindings,
      encryptedOutRootAddresses,
    };

    const witness = await circuit.calculateWitness(inputs);
    await circuit.checkConstraints(witness);
  });
});
