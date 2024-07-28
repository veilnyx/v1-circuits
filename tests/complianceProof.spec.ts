import { sliceHex } from 'viem';
import { Point, elGamal } from '@zkfi-tech/babyjubjub';
import { randomBigInt } from '@zkfi-tech/utils';
import { poseidonEncrypt } from '@zk-kit/poseidon-cipher';
import { encodeAsset } from './helpers/asset';
import { getCircuit, randomAccount } from './helpers';

const t1: number = 0x010001;
const t2: number = 0x010002;
const t3: number = 0x020000;

describe('complianceProof', function () {
  let circuit;

  const revokerPublicKey = Point.generate(randomBigInt(31));
  const keyEncryptionPublicKey = Point.generate(randomBigInt(31));
  const dataEncryptionPrivateKey = randomBigInt(31);
  const dataEncryptionPublicKey = Point.generate(dataEncryptionPrivateKey);
  const ephemeralKey = randomBigInt(31);
  const ephemeralPublicKey = Point.generate(ephemeralKey);
  const senderAcc = randomAccount();

  before(async function () {
    circuit = await getCircuit('complianceProof');
  });

  it('should verify for correct compliance inputs', async function () {
    const inRootAddress = senderAcc.rootAddress;
    const refundAddressBlinding = randomBigInt(31);

    const outAssetIds = [t1, t1, t2, t3];
    const outValues = outAssetIds.map((_) => randomBigInt(16));
    const outBlindings = outAssetIds.map((_) => randomBigInt(31));
    const outRootAddresses = outAssetIds.map((_) => randomBigInt(31));
    const outAssets = outValues.map((v, i) => encodeAsset(outAssetIds[i], v));

    const encryptedDataEncryptionPrivateKey = BigInt(
      sliceHex(
        elGamal.encrypt(dataEncryptionPrivateKey, keyEncryptionPublicKey, ephemeralKey),
        32,
        64,
      ),
    );

    const plainData = [
      inRootAddress,
      refundAddressBlinding,
      ...outAssets,
      ...outRootAddresses,
      ...outBlindings,
    ];

    const encryptedNoteData: bigint[] = poseidonEncrypt(
      plainData,
      dataEncryptionPublicKey.toArray() as any,
      BigInt(0),
    );

    const encryptedData = [
      ...ephemeralPublicKey.toArray(),
      encryptedDataEncryptionPrivateKey,
      ...encryptedNoteData,
    ];

    const inputs = {
      ephemeralKey,
      keyEncryptionPublicKey: keyEncryptionPublicKey.toArray(),
      dataEncryptionPrivateKey,
      plainData,
      encryptedData,
    };

    const witness = await circuit.calculateWitness(inputs);
    await circuit.checkConstraints(witness);
  });
});
