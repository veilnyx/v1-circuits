import { assert } from 'chai';
import { BigNumber } from 'ethers';
import { MerkleTree } from 'fixed-merkle-tree';
import {
  createNote,
  getCircuit,
  poseidonHash,
  randomAccount,
  randomHex,
  signPoseidon,
} from './helpers';

const getTree = () => new MerkleTree(20, [], { hashFunction: poseidonHash });

describe('multiTransact', function () {
  this.timeout(8000);

  let circuit;
  let account;

  before(async function () {
    circuit = await getCircuit('multiTransact');
    account = randomAccount();
  });

  it('should multi-transact', async function () {
    const address = account.address;
    const tree = getTree();
    const assetIds = [randomHex(20), randomHex(20)];
    const inNotes1 = [
      createNote({ address, value: 10, assetId: assetIds[0] }),
      createNote({ address, value: 20, assetId: assetIds[0] }),
    ];
    const inNotes2 = [
      createNote({ address, value: 5, assetId: assetIds[1] }),
      createNote({ address, value: 20, assetId: assetIds[1] }),
    ];

    tree.bulkInsert([
      ...inNotes1.map((note) => note.commitment),
      ...inNotes2.map((note) => note.commitment),
    ]);

    const signs1 = inNotes1.map((note) => signPoseidon(note.commitment, account.privateKey));
    const signs2 = inNotes2.map((note) => signPoseidon(note.commitment, account.privateKey));

    const nullifiers1 = signs1.map((sign, i) => poseidonHash(i, sign.R8[0], sign.R8[1], sign.S));
    const nullifiers2 = signs2.map((sign, i) =>
      poseidonHash(i + 2, sign.R8[0], sign.R8[1], sign.S),
    );

    const outNotes1 = [
      createNote({ address, value: 5, assetId: assetIds[0] }),
      createNote({ address, value: 20, assetId: assetIds[0] }),
    ];
    const outNotes2 = [
      createNote({ address, value: 5, assetId: assetIds[1] }),
      createNote({ address, value: 20, assetId: assetIds[1] }),
    ];

    const outPublicValue = [5, 0];

    const inputs = {
      // ins
      root: BigNumber.from(tree.root).toHexString(),
      assetId: assetIds,
      inPublicValue: [0, 0],
      inPublicKey: [
        [account.publicKey, account.publicKey],
        [account.publicKey, account.publicKey],
      ],
      inSignature: [
        [
          [signs1[0].R8[0], signs1[0].R8[1], signs1[0].S],
          [signs1[1].R8[0], signs1[1].R8[1], signs1[1].S],
        ],
        [
          [signs2[0].R8[0], signs2[0].R8[1], signs2[0].S],
          [signs2[1].R8[0], signs2[1].R8[1], signs2[1].S],
        ],
      ],
      inValue: [inNotes1.map((n) => n.value), inNotes2.map((n) => n.value)],
      inSalt: [inNotes1.map((n) => n.salt), inNotes2.map((n) => n.salt)],
      inNullifier: [nullifiers1, nullifiers2],
      inPathIndices: [
        [0, 1],
        [2, 3],
      ],
      inPathElements: [
        [tree.path(0).pathElements, tree.path(1).pathElements],
        [tree.path(2).pathElements, tree.path(3).pathElements],
      ],
      // outs
      outPublicValue,
      outAddress: [outNotes1.map((n) => n.address), outNotes2.map((n) => n.address)],
      outValue: [outNotes1.map((n) => n.value), outNotes2.map((n) => n.value)],
      outSalt: [outNotes1.map((n) => n.salt), outNotes2.map((n) => n.salt)],
      outCommitment: [outNotes1.map((n) => n.commitment), outNotes2.map((n) => n.commitment)],
      dataHash: poseidonHash(randomHex(32)),
    };

    await assert.isFulfilled(circuit.calculateWitness(inputs, true));

    const witness = await circuit.calculateWitness(inputs, true);
    await circuit.checkConstraints(witness);
  });
});
