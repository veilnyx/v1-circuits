import { Point, poseidonHash } from '@zkfi-tech/babyjubjub';
import { createNote, getCircuit, randomAccount, randomHex } from './helpers';
import { randomBigInt } from '@zkfi-tech/utils';
import { parseEther } from 'viem';
import MerkleTree from 'fixed-merkle-tree';

const eth = (n: number) => parseEther(`${n}`);
const cmTreeDepth = 25;
// const addrTreeDepth = 20;
const getCmTree = () =>
  new MerkleTree(cmTreeDepth, [], { hashFunction: (a, b) => poseidonHash([a, b]) });
// const getAddrTree = () =>
//   new MerkleTree(addrTreeDepth, [], { hashFunction: (a, b) => poseidonHash([a, b]) });

describe('anonymityScore', function () {
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

  it('correctly calculate anonymity score', async function () {
    const circuit = await getCircuit('anonymityScore');
    const signPublicKey = [randomHex(31), randomHex(31)];
    const viewPrivateKey = randomHex(31);
    const address = poseidonHash([signPublicKey[0], signPublicKey[1], viewPrivateKey]);
    const cmTree = getCmTree();

    const assetId = ft1;

    const notes = Array.from({ length: 2 }, (_, i) => {
      return createNote({
        account: sender,
        revokerPublicKey,
        value: randomBigInt(16),
        assetId,
        leafIndex: i,
      });
    });

    const nullifyLeafIndices = [10, 10];
    const anonymityScore = notes
      .map((n, i) => n.value * BigInt(nullifyLeafIndices[i] - n.leafIndex))
      .reduce((acc, v) => acc + v, BigInt(0));

    cmTree.bulkInsert(notes.map((n: any) => n.commitment));

    const inputs = {
      commitmentTreeRoot: cmTree.root,
      assetId,
      viewPrivateKey: sender.viewer.privateKey,
      signPublicKey: sender.signer.publicKey.toArray(),
      revokerPublicKeys: notes.map((n) => n.revokerPublicKey.toArray()),
      values: notes.map((n) => n.value),
      blindings: notes.map((n) => n.blinding),
      leafIndices: notes.map((n) => n.leafIndex),
      pathElements: notes.map((n) => cmTree.path(n.leafIndex).pathElements),
      nullifiers: notes.map((n) => n.nullifier),
      nullifyLeafIndices,
      anonymityScore,
    };

    const witness = await circuit.calculateWitness(inputs, true);
    // expectEqFe(witness[1], address);
    // await circuit.checkConstraints(witness);
  });
});
