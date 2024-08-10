import { Point, elGamal, poseidonEncrypt } from '@zkfi-tech/babyjubjub';
import { randomBigInt } from '@zkfi-tech/utils';
import { encodeAsset } from './helpers/asset';
import { createNote, deriveKeys, getCircuit, randomAccount } from './helpers';

const t1: number = 0x010001;
const t2: number = 0x010002;
const t3: number = 0x020000;

describe('complianceProof', function () {
  this.timeout(10000);
  let circuit;

  const revokerPublicKey = Point.generate(randomBigInt(31));
  const keySeedEncryptionPublicKey = Point.generate(randomBigInt(31));
  const dataEncryptionKeySeed = randomBigInt(31);
  const keySeedEncryptionEphemeralKey = randomBigInt(31);
  const senderAcc = randomAccount();

  before(async function () {
    circuit = await getCircuit('complianceProof');
  });

  it('should verify for correct compliance inputs', async function () {
    const refundAddressBlinding = randomBigInt(31);

    const n = 4;
    const notes = Array.from({ length: n }, () =>
      createNote({
        account: senderAcc,
        value: randomBigInt(16),
        assetId: t1,
        leafIndex: Number(randomBigInt(2)),
        revokerPublicKey: revokerPublicKey,
      }),
    );
    const assets = notes.map((n) => encodeAsset(n.assetId, n.value));

    const dataEncryptionPrivateKeys = deriveKeys(dataEncryptionKeySeed, n + 1);
    const dataEncryptionPublicKeys = dataEncryptionPrivateKeys.map((k) => Point.generate(k));

    const refundData = [senderAcc.rootAddress, refundAddressBlinding];
    const noteData = notes.map((n, i) => [assets[i], n.rootAddress, n.blinding]);
    const [encryptedRefundData, ...encryptedNoteData] = [refundData, ...noteData].map((d, i) => {
      return poseidonEncrypt(d, dataEncryptionPublicKeys[i], BigInt(0));
    });

    const encryptedDataEncryptionKeySeed = elGamal.encrypt(
      dataEncryptionKeySeed,
      keySeedEncryptionPublicKey,
      keySeedEncryptionEphemeralKey,
    );

    const inputs = {
      keySeedEncryptionEphemeralKey,
      keySeedEncryptionPublicKey: keySeedEncryptionPublicKey.toArray(),
      dataEncryptionKeySeed,
      refundData,
      noteData,
      encryptedDataEncryptionKeySeed,
      encryptedRefundData,
      encryptedNoteData,
    };

    const witness = await circuit.calculateWitness(inputs);
    await circuit.checkConstraints(witness);
  });
});
