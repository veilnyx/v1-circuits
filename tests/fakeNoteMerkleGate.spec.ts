import chai, { assert } from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
import { parseEther } from 'viem';
import { poseidonEncrypt, Point, elGamal } from '@veilnyx-sdk/babyjubjub';
import { randomBigInt } from '@veilnyx-sdk/utils';
import { createNote, deriveKeys, getCircuit, getMerkleTree, randomAccount, toPaddedHex, pointToArray, getBindingSignals } from './helpers';
import { encodeAsset } from './helpers/asset';

const P = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
const ft1 = 0x010001;

// Nov 2026 circuit audit, Low: `MerkleProof.enabled <== assetId + value` was also zero for
// value == p - assetId, so a note outside the tree skipped the inclusion check.
describe('regression: dummy-note Merkle gate (value == p - assetId)', function () {
  this.timeout(120000);
  let circuit: any;
  const sender = randomAccount();
  const revokerPublicKey = Point.generate(randomBigInt(31));
  const kPub = Point.generate(randomBigInt(31));
  const seed = randomBigInt(31);
  before(async () => { circuit = await getCircuit('transact22'); });

  const build = (fakeValue: bigint, outValue: bigint, pubValue: bigint) => {
    const addressTree = getMerkleTree(20);
    addressTree.insert(toPaddedHex(sender.rootAddress));
    // commitment tree holds ONE unrelated leaf; the fake note is never inserted
    const cmTree = getMerkleTree(32);
    cmTree.insert(toPaddedHex(123456789n));
    const inNotes = [
      createNote({ account: sender, revokerPublicKey, value: fakeValue, assetId: ft1, leafIndex: 0 }),
      createNote({ account: sender, revokerPublicKey, value: 0n, assetId: 0, leafIndex: 1 }),
    ];
    const outNotes = [
      createNote({ account: sender, revokerPublicKey, value: outValue, assetId: ft1, leafIndex: 2 }),
      createNote({ account: sender, revokerPublicKey, value: 0n, assetId: ft1, leafIndex: 3 }),
    ];
    const hash = randomBigInt(31);
    const sign = sender.sign(hash);
    const rb = randomBigInt(31);
    const refundAddress = sender.getBlindedAddress(revokerPublicKey, rb);
    const ek = randomBigInt(31);
    const encSeed = elGamal.encrypt(seed, kPub, ek);
    const keys = deriveKeys(seed, 3).map((k) => Point.generate(k));
    const noteData = outNotes.map((n) => [encodeAsset(n.assetId, n.value), n.rootAddress, n.blinding]);
    const [encRefund, ...encNotes] = [[sender.rootAddress, rb], ...noteData].map((d, i) => poseidonEncrypt(d, keys[i], 0n));
    const pubAssetIds = [ft1, 0];
    const pubValues = [pubValue, 0n];
    const inNullifiers = inNotes.map((n) => n.nullifier);
    const outCommitments = outNotes.map((n) => n.commitment);
    const { alpha, beta, gamma } = getBindingSignals({
      header: {
        addressTreeRoot: addressTree.root.toString(), commitmentTreeRoot: cmTree.root.toString(), hash,
        pubFlow: 0, outRevokerPublicKey: pointToArray(revokerPublicKey), refundAddress,
        keySeedEncryptionPublicKey: pointToArray(kPub),
      },
      pubAssetIds, pubValues, inNullifiers, outCommitments,
      encryptedDataEncryptionKeySeed: encSeed, encryptedRefundData: encRefund, encryptedNoteData: encNotes });
    return {
      commitmentTreeRoot: cmTree.root.toString(), hash, signature: [sign.s, sign.e],
      addressTreeRoot: addressTree.root.toString(), addressPathIndex: 0,
      addressPathElements: addressTree.path(0).pathElements.map((x) => BigInt(x)),
      pubFlow: 0, pubAssetIds, pubValues,
      inViewPrivateKey: sender.viewer.privateKey, inSignPublicKey: pointToArray(sender.signer.publicKey),
      inRevokerPublicKeys: inNotes.map(() => pointToArray(revokerPublicKey)),
      inAssetIds: inNotes.map((n) => n.assetId), inValues: inNotes.map((n) => n.value),
      inBlindings: inNotes.map((n) => n.blinding), inNullifiers,
      inPathIndices: [0, 1], inPathElements: [Array(32).fill(0n), Array(32).fill(0n)],
      outRevokerPublicKey: pointToArray(revokerPublicKey),
      outAssetIds: outNotes.map((n) => n.assetId), outRootAddresses: outNotes.map((n) => n.rootAddress),
      outValues: outNotes.map((n) => n.value), outBlindings: outNotes.map((n) => n.blinding), outCommitments,
      refundAddress, refundAddressBlinding: rb,
      keySeedEncryptionEphemeralKey: ek, keySeedEncryptionPublicKey: pointToArray(kPub),
      dataEncryptionKeySeed: seed, encryptedDataEncryptionKeySeed: encSeed,
      encryptedRefundData: encRefund, encryptedNoteData: encNotes, alpha, beta, gamma,
    };
  };

  it('REJECTS an input note (ft1, p - ft1) that is not in the tree', async () => {
    const dep = parseEther('5');
    await assert.isRejected(circuit.calculateWitness(build(P - BigInt(ft1), dep - BigInt(ft1), dep), true));
  });
  // Dummy inputs (assetId 0, value 0) still skip the check: covered by
  // 'should transact a fresh deposit with correct proofs' in transact.spec.ts.
});
