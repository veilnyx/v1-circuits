import { assert } from 'chai';
import { parseEther, slice } from 'viem';
import { MerkleTree } from 'fixed-merkle-tree';
import { Point, elGamal, poseidonHash } from '@zkfi-tech/babyjubjub';
import { randomBigInt, randomHex } from '@zkfi-tech/utils';
import { NoteData, createNote, getCircuit, randomAccount } from './helpers';
import { encodeAsset } from './helpers/asset';

const eth = (n: number) => parseEther(`${n}`);
const treeDepth = 32;
const getTree = () =>
  new MerkleTree(treeDepth, [], { hashFunction: (a, b) => poseidonHash([a, b]) });

describe('transact', function () {
  this.timeout(8000);

  let circuit;
  let sender;
  let receiver;
  let senderPubKey;
  let receiverPubKey;
  let encPublicKey;

  let ft1 = 0x010001;

  before(async function () {
    circuit = await getCircuit('transact22');
    sender = randomAccount();
    receiver = randomAccount();
    senderPubKey = sender.signer.publicKey.toArray();
    receiverPubKey = receiver.signer.publicKey.toArray();
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
    const tree = getTree();
    tree.bulkInsert(inNotes.map((n: any) => n.commitment));
    const hash = randomHex(31);
    const sign = sender.sign(hash);

    const ephKey = randomBigInt(31);
    const ephPubKey = Point.generate(ephKey);

    const assets = outNotes.map((note: any) => encodeAsset(note.assetId, note.value));
    const encAssets = assets.map((a) => {
      const ciphertext = elGamal.encrypt(a, encPublicKey, ephKey);
      return BigInt(slice(ciphertext, 32, 64));
    });
    const encBlindings = outNotes.map((n) => {
      const ciphertext = elGamal.encrypt(n.blinding, encPublicKey, ephKey);
      return BigInt(slice(ciphertext, 32, 64));
    });
    const encPublicKeyXs = outNotes.map((n) => {
      const ciphertext = elGamal.encrypt(n.pubKey[0], encPublicKey, ephKey);
      return BigInt(slice(ciphertext, 32, 64));
    });

    const inputs = {
      merkleRoot: tree.root.toString(),
      hash,
      signature: [sign.s, sign.e],
      // public
      pubFlow,
      pubAssetIds: [ft1, ft1],
      pubValues: pubValues,
      // ins
      inPublicKey: senderPubKey,
      inAssetIds: inNotes.map((note: any) => note.assetId),
      inValues: inNotes.map((note: any) => note.value),
      inBlindings: inNotes.map((note: any) => note.blinding),
      inNullifiers: inNotes.map((note: any) => note.nullifier),
      inPathIndices: inNotes.map((n) => n.leafIndex),
      inPathElements: inNotes.map((n) => tree.path(n.leafIndex).pathElements),
      // outs
      outAssetIds: outNotes.map((note: any) => note.assetId),
      outPublicKeys: outNotes.map((note: any) => note.pubKey),
      outValues: outNotes.map((note: any) => note.value),
      outBlindings: outNotes.map((note: any) => note.blinding),
      outCommitments: outNotes.map((note: any) => note.commitment),
      // encryptions
      ephKey,
      ephPubKey: [ephPubKey.x, ephPubKey.y],
      encPubKey: encPublicKey.toArray(),
      encAssets,
      encBlindings,
      encPublicKeyXs,
    };
    return inputs;
  };

  it('should transact a fresh deposit with correct proofs', async function () {
    const pubFlow = 0; // deposit
    const pubValues = [eth(5), eth(0)];
    const inNotes = pubValues.map((_, i) => {
      return createNote({
        pubKey: senderPubKey,
        value: eth(0),
        assetId: 0,
        leafIndex: i,
      });
    });
    const outNotes = [
      createNote({
        pubKey: senderPubKey,
        value: eth(5),
        assetId: ft1,
        leafIndex: 2,
      }),
      createNote({
        pubKey: senderPubKey,
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
        pubKey: senderPubKey,
        value: eth(10),
        assetId: ft1,
        leafIndex: 0,
      }),
      createNote({
        pubKey: senderPubKey,
        value: eth(20),
        assetId: ft1,
        leafIndex: 1,
      }),
    ];
    const outNotes = [
      createNote({
        pubKey: senderPubKey,
        value: eth(15),
        assetId: ft1,
        leafIndex: 2,
      }),
      createNote({
        pubKey: receiverPubKey,
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
        pubKey: senderPubKey,
        value: eth(10),
        assetId: ft1,
        leafIndex: 0,
      }),
      createNote({
        pubKey: senderPubKey,
        value: eth(20),
        assetId: ft1,
        leafIndex: 1,
      }),
    ];
    const outNotes = [
      createNote({
        pubKey: senderPubKey,
        value: eth(10),
        assetId: ft1,
        leafIndex: 2,
      }),
      createNote({
        pubKey: receiverPubKey,
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
        pubKey: senderPubKey,
        value: eth(10),
        assetId: ft1,
        leafIndex: 0,
      }),
      createNote({
        pubKey: senderPubKey,
        value: eth(20),
        assetId: ft1,
        leafIndex: 1,
      }),
    ];
    const outNotes = [
      createNote({
        pubKey: senderPubKey,
        value: eth(5),
        assetId: ft1,
        leafIndex: 2,
      }),
      createNote({
        pubKey: receiverPubKey,
        value: eth(20),
        assetId: ft1,
        leafIndex: 3,
      }),
    ];
    const inputs = createTx({ pubFlow, inNotes, outNotes, pubValues });
    await assert.isFulfilled(circuit.calculateWitness(inputs, true));
  });
});
