import { assert } from 'chai';
import { parseEther, slice } from 'viem';
import { MerkleTree } from 'fixed-merkle-tree';
import { Point, elGamal, poseidonHash } from '@zkfi-tech/babyjubjub';
import { randomBigInt, randomHex } from '@zkfi-tech/utils';
import { NoteData, createNote, getCircuit, randomAccount } from './helpers';
import { encodeAsset } from './helpers/asset';

const eth = (n: number) => parseEther(`${n}`);
const cmTreeDepth = 32;
const addrTreeDepth = 20;
const getCmTree = () =>
  new MerkleTree(cmTreeDepth, [], { hashFunction: (a, b) => poseidonHash([a, b]) });
const getAddrTree = () =>
  new MerkleTree(addrTreeDepth, [], { hashFunction: (a, b) => poseidonHash([a, b]) });

describe('transact', function () {
  this.timeout(8000);

  let circuit;
  let sender;
  let receiver;
  let senderPubKey;
  let receiverPubKey;
  let revokerPublicKey;
  let encPublicKey;

  let ft1 = 0x010001;

  before(async function () {
    circuit = await getCircuit('transact22');
    sender = randomAccount();
    receiver = randomAccount();
    senderPubKey = sender.signer.publicKey.toArray();
    receiverPubKey = receiver.signer.publicKey.toArray();
    revokerPublicKey = Point.generate(randomBigInt(31));
    encPublicKey = Point.generate(randomBigInt(31));
  });

  const createTx = ({
    pubFlow,
    inNotes,
    outNotes,
    pubValues,
  }: {
    pubFlow: number;
    inNotes: NoteData[];
    outNotes: NoteData[];
    pubValues: bigint[];
  }) => {
    const commitmentsTree = getCmTree();
    const addressTree = getAddrTree();
    commitmentsTree.bulkInsert(inNotes.map((n: any) => n.commitment));
    addressTree.insert(sender.address);
    const hash = randomHex(31);
    const sign = sender.sign(hash);

    const beneficiaryBlinding = randomBigInt(31);
    const beneficiary = sender.getStealthAddress(revokerPublicKey, beneficiaryBlinding);

    const ephKey = randomBigInt(31);
    const ephPubKey = Point.generate(ephKey);

    const encInAddress = BigInt(
      slice(elGamal.encrypt(sender.address, encPublicKey, ephKey), 32, 64),
    );
    const encBeneficiaryBlinding =
      BigInt(beneficiary) === 0n
        ? 0
        : BigInt(slice(elGamal.encrypt(beneficiaryBlinding, encPublicKey, ephKey), 32, 64));

    const assets = outNotes.map((note: any) => encodeAsset(note.assetId, note.value));
    const encOutAssets = assets.map((a) => {
      const ciphertext = elGamal.encrypt(a, encPublicKey, ephKey);
      return BigInt(slice(ciphertext, 32, 64));
    });
    const encOutBlindings = outNotes.map((n) => {
      const ciphertext = elGamal.encrypt(n.blinding, encPublicKey, ephKey);
      return BigInt(slice(ciphertext, 32, 64));
    });
    const encOutAddresses = outNotes.map((n) => {
      const ciphertext = elGamal.encrypt(n.address, encPublicKey, ephKey);
      return BigInt(slice(ciphertext, 32, 64));
    });

    const inputs = {
      commitmentTreeRoot: commitmentsTree.root.toString(),
      hash,
      signature: [sign.s, sign.e],
      // address reg
      addressTreeRoot: addressTree.root.toString(),
      addressPathIndex: addressTree.indexOf(sender.address),
      addressPathElements: addressTree
        .path(addressTree.indexOf(sender.address))
        .pathElements.map((x) => BigInt(x)),
      // public
      pubFlow,
      pubAssetIds: [ft1, ft1],
      pubValues: pubValues,
      // ins
      inViewPrivateKey: sender.viewer.privateKey,
      inSignPublicKey: sender.signer.publicKey.toArray(),
      inRevokerPublicKeys: inNotes.map(() => revokerPublicKey.toArray()),
      inAssetIds: inNotes.map((note: any) => note.assetId),
      inValues: inNotes.map((note: any) => note.value),
      inBlindings: inNotes.map((note: any) => note.blinding),
      inNullifiers: inNotes.map((note: any) => note.nullifier),
      inPathIndices: inNotes.map((n) => n.leafIndex),
      inPathElements: inNotes.map((n) => commitmentsTree.path(n.leafIndex).pathElements),
      // outs
      outRevokerPublicKey: revokerPublicKey.toArray(),
      outAssetIds: outNotes.map((note: any) => note.assetId),
      outAddresses: outNotes.map((note: any) => note.address),
      outValues: outNotes.map((note: any) => note.value),
      outBlindings: outNotes.map((note: any) => note.blinding),
      outCommitments: outNotes.map((note: any) => note.commitment),
      // beneficiary
      beneficiary,
      beneficiaryBlinding,
      // encryptions
      ephKey,
      ephPubKey: ephPubKey.toArray(),
      encPubKey: encPublicKey.toArray(),
      encInAddress,
      encBeneficiaryBlinding,
      encOutAssets,
      encOutBlindings,
      encOutAddresses,
    };
    return inputs;
  };

  it('should transact a fresh deposit with correct proofs', async function () {
    const pubFlow = 0; // deposit
    const pubValues = [eth(5), eth(0)];
    const inNotes = pubValues.map((_, i) => {
      return createNote({
        account: sender,
        revokerPublicKey,
        value: eth(0),
        assetId: 0,
        leafIndex: i,
      });
    });
    const outNotes = [
      createNote({
        account: sender,
        revokerPublicKey,
        value: eth(5),
        assetId: ft1,
        leafIndex: 2,
      }),
      createNote({
        account: sender,
        revokerPublicKey,
        value: eth(0),
        assetId: ft1,
        leafIndex: 3,
      }),
    ];

    const inputs = createTx({ pubFlow, inNotes, outNotes, pubValues });
    await assert.isFulfilled(circuit.calculateWitness(inputs, true));
  });

  it('should transact a deposit with correct proofs', async function () {
    const pubFlow = 0;
    const pubValues = [eth(5), eth(0)];
    const inNotes = [
      createNote({
        account: sender,
        revokerPublicKey,
        value: eth(10),
        assetId: ft1,
        leafIndex: 0,
      }),
      createNote({
        account: sender,
        revokerPublicKey,
        value: eth(20),
        assetId: ft1,
        leafIndex: 1,
      }),
    ];
    const outNotes = [
      createNote({
        account: sender,
        revokerPublicKey,
        value: eth(15),
        assetId: ft1,
        leafIndex: 2,
      }),
      createNote({
        account: sender,
        revokerPublicKey,
        value: eth(20),
        assetId: ft1,
        leafIndex: 3,
      }),
    ];
    const inputs = createTx({ pubFlow, inNotes, outNotes, pubValues });
    await assert.isFulfilled(circuit.calculateWitness(inputs, true));
  });

  it('should transact a transfer with correct proofs', async function () {
    const pubFlow = 1;
    const pubValues = [eth(0), eth(0)];
    const inNotes = [
      createNote({
        account: sender,
        revokerPublicKey,
        value: eth(10),
        assetId: ft1,
        leafIndex: 0,
      }),
      createNote({
        account: sender,
        revokerPublicKey,
        value: eth(20),
        assetId: ft1,
        leafIndex: 1,
      }),
    ];
    const outNotes = [
      createNote({
        account: sender,
        revokerPublicKey,
        value: eth(10),
        assetId: ft1,
        leafIndex: 2,
      }),
      createNote({
        account: sender,
        revokerPublicKey,
        value: eth(20),
        assetId: ft1,
        leafIndex: 3,
      }),
    ];
    const inputs = createTx({ pubFlow, inNotes, outNotes, pubValues });
    await assert.isFulfilled(circuit.calculateWitness(inputs, true));
  });

  it('should transact a withdraw with correct proofs', async function () {
    const pubFlow = 1;
    const pubValues = [eth(5), eth(0)];
    const inNotes = [
      createNote({
        account: sender,
        revokerPublicKey,
        value: eth(10),
        assetId: ft1,
        leafIndex: 0,
      }),
      createNote({
        account: sender,
        revokerPublicKey,
        value: eth(20),
        assetId: ft1,
        leafIndex: 1,
      }),
    ];
    const outNotes = [
      createNote({
        account: sender,
        revokerPublicKey,
        value: eth(5),
        assetId: ft1,
        leafIndex: 2,
      }),
      createNote({
        account: receiver,
        revokerPublicKey,
        value: eth(20),
        assetId: ft1,
        leafIndex: 3,
      }),
    ];
    const inputs = createTx({ pubFlow, inNotes, outNotes, pubValues });
    await assert.isFulfilled(circuit.calculateWitness(inputs, true));
  });
});
