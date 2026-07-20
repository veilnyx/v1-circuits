import { Point } from '@veilnyx-sdk/babyjubjub';
import { randomBigInt } from '@veilnyx-sdk/utils';
import { createNote, getCircuit, getMerkleTree, randomAccount,
  pointToArray,
} from './helpers';

const cmTreeDepth = 25;
const getCmTree = () => getMerkleTree(cmTreeDepth);

describe('anonymityScore', function () {
  this.timeout(8000);

  let circuit;
  let ft1 = 0x010001;
  const sender = randomAccount();
  const revokerPublicKey = Point.generate(randomBigInt(31));

  before(async function () {
    circuit = await getCircuit('transact22');
  });

  it('correctly calculate anonymity score', async function () {
    const circuit = await getCircuit('anonymityScore');
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
      signPublicKey: pointToArray(sender.signer.publicKey),
      revokerPublicKeys: notes.map((n) => pointToArray(n.revokerPublicKey)),
      values: notes.map((n) => n.value),
      blindings: notes.map((n) => n.blinding),
      leafIndices: notes.map((n) => n.leafIndex),
      pathElements: notes.map((n) => cmTree.path(n.leafIndex).pathElements),
      nullifiers: notes.map((n) => n.nullifier),
      nullifyLeafIndices,
      anonymityScore,
    };

    const witness = await circuit.calculateWitness(inputs, true);
  });
});
