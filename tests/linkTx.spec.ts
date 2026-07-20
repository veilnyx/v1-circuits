import chai, { assert } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { createNote, getCircuit, pointToArray } from './helpers';
import MerkleTree from 'fixed-merkle-tree';
import { Point, poseidonHash } from '@veilnyx-sdk/babyjubjub';
import { hexFixed, randomBigInt, randomHex } from '@veilnyx-sdk/utils';
import { toHex, padHex } from 'viem';

chai.use(chaiAsPromised);
const getTree = () => new MerkleTree(32, [], { hashFunction: (a, b) => poseidonHash([a, b]) });

describe('linkTx', function () {
  this.timeout(8000);
  let circuit;
  let pubKey;

  before(async function () {
    circuit = await getCircuit('linkTx');
    pubKey = Point.generate(randomBigInt(31));
  });

  it('should correctly link transactions', async () => {
    const tree = getTree();
    const notes = Array.from({ length: 2 }).map((_, i) =>
      createNote({
        value: randomBigInt(16),
        pubKey: pointToArray(pubKey),
        assetId: 0x010001 + i,
        leafIndex: i,
      }),
    );

    // random inserts
    tree.bulkInsert([randomHex(31), randomHex(31)]);

    // Assume notes are deposits from good source
    tree.bulkInsert(notes.map((note) => hexFixed(note.commitment, 32)));

    const pathIndices = notes.map((note) => tree.indexOf(hexFixed(note.commitment, 32)));
    const pathElements = notes.map((note, i) => {
      const index = pathIndices[i];
      return tree.path(index).pathElements;
    });

    const inputs = {
      root: tree.root.toString(),
      assetIds: notes.map((note) => note.assetId),
      owners: notes.map((note) => note.owner),
      values: notes.map((note) => note.value),
      blindings: notes.map((note) => note.blinding),
      leafIndices: notes.map((note) => note.leafIndex),
      pathIndices,
      pathElements,
      nullifiers: notes.map((note) => note.nullifier),
    };

    // const witness = await circuit.calculateWitness(inputs, true);
    await assert.isFulfilled(circuit.calculateWitness(inputs, true));
  });

  it('should ignore dummy notes for inclusion', async () => {
    const tree = getTree();
    const realNote = createNote({
      value: randomBigInt(16),
      pubKey: pointToArray(pubKey),
      assetId: 0x010001,
      leafIndex: 0,
    });

    const dummyNote = createNote({
      value: BigInt(0),
      pubKey: pointToArray(pubKey),
      assetId: 0,
      leafIndex: 0,
    });
    const notes = [realNote, dummyNote];

    // random inserts
    tree.bulkInsert([randomHex(31), randomHex(31)]);

    // Assume notes are deposits from good source
    tree.insert(hexFixed(realNote.commitment, 32));

    const pathIndices = notes.map((n) => {
      const index = n.assetId === 0 ? 0 : tree.indexOf(padHex(toHex(n.commitment), { size: 32 }));
      if (index < 0) {
        throw new Error(`Note commitment ${n.commitment} not found in tree`);
      }
      return index;
    });
    const pathElements = notes.map((n, i) => {
      const index = pathIndices[i];
      const pathElements =
        n.assetId === 0 ? Array(tree.levels).fill('0') : tree.path(index).pathElements;
      return pathElements;
    });

    const inputs = {
      root: tree.root.toString(),
      assetIds: notes.map((note) => note.assetId),
      owners: notes.map((note) => note.owner),
      values: notes.map((note) => note.value),
      blindings: notes.map((note) => note.blinding),
      leafIndices: notes.map((note) => note.leafIndex),
      pathIndices,
      pathElements,
      nullifiers: notes.map((note) => note.nullifier),
    };

    const witness = await circuit.calculateWitness(inputs, true);
    // await assert.isFulfilled(circuit.calculateWitness(inputs, true));
  });
});
