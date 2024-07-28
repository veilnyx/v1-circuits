import { assert } from 'chai';
import { padHex, parseEther, sliceHex, toHex } from 'viem';
import { poseidonEncrypt } from '@zk-kit/poseidon-cipher';
import { MerkleTree } from 'fixed-merkle-tree';
import { Point, elGamal, poseidonHash } from '@zkfi-tech/babyjubjub';
import { randomBigInt, randomHex } from '@zkfi-tech/utils';
import { NoteData, createNote, getCircuit, randomAccount } from './helpers';
import { encodeAsset } from './helpers/asset';

const eth = (n: number) => parseEther(`${n}`);
const toPaddedHex = (n: bigint) => padHex(toHex(n), { size: 32 });
const cmTreeDepth = 32;
const addrTreeDepth = 20;
const getCmTree = () =>
  new MerkleTree(cmTreeDepth, [], { hashFunction: (a, b) => poseidonHash([a, b]) });
const getAddrTree = () =>
  new MerkleTree(addrTreeDepth, [], { hashFunction: (a, b) => poseidonHash([a, b]) });

describe('transact', function () {
  this.timeout(8000);

  let circuit;
  const sender = randomAccount();
  const receiver = randomAccount();
  const revokerPublicKey = Point.generate(randomBigInt(31));
  const keyEncryptionPublicKey = Point.generate(randomBigInt(31));
  const dataEncryptionPrivateKey = randomBigInt(31);
  const dataEncryptionPublicKey = Point.generate(dataEncryptionPrivateKey);

  let ft1 = 0x010001;

  before(async function () {
    circuit = await getCircuit('transact22');
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
    addressTree.insert(toPaddedHex(sender.rootAddress));
    const hash = randomHex(31);
    const sign = sender.sign(hash);

    const refundAddressBlinding = randomBigInt(31);
    const refundAddress = sender.getBlindedAddress(revokerPublicKey, refundAddressBlinding);

    const ephemeralKey = randomBigInt(31);
    const ephemeralPublicKey = Point.generate(ephemeralKey);

    const encryptedDataEncryptionPrivateKey = BigInt(
      sliceHex(
        elGamal.encrypt(dataEncryptionPrivateKey, keyEncryptionPublicKey, ephemeralKey),
        32,
        64,
      ),
    );

    const outNoteArr: bigint[] = [];
    outNotes.forEach((n, i) => {
      const asset = encodeAsset(n.assetId, n.value);
      outNoteArr.push(asset);
      outNoteArr.push(n.rootAddress);
      outNoteArr.push(n.blinding);
    });

    const plainData = [sender.rootAddress, refundAddressBlinding, ...outNoteArr];

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
      commitmentTreeRoot: commitmentsTree.root.toString(),
      hash,
      signature: [sign.s, sign.e],
      // address reg
      addressTreeRoot: addressTree.root.toString(),
      addressPathIndex: addressTree.indexOf(toPaddedHex(sender.rootAddress)),
      addressPathElements: addressTree
        .path(addressTree.indexOf(toPaddedHex(sender.rootAddress)))
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
      outRootAddresses: outNotes.map((note: any) => note.rootAddress),
      outValues: outNotes.map((note: any) => note.value),
      outBlindings: outNotes.map((note: any) => note.blinding),
      outCommitments: outNotes.map((note: any) => note.commitment),
      // refund address
      refundAddress,
      refundAddressBlinding,
      // encryptions
      ephemeralKey,
      keyEncryptionPublicKey: keyEncryptionPublicKey.toArray(),
      dataEncryptionPrivateKey,
      encryptedData,
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
