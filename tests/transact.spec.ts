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

describe('transact', function () {
  this.timeout(8000);

  let circuit;
  let account;

  before(async function () {
    circuit = await getCircuit('transact');
    account = randomAccount();
  });

  it('should transact with correct proofs', async function () {
    const address = account.address;
    const tree = getTree();
    const inNote1 = createNote({ address, value: 10 });
    const inNote2 = createNote({ address, value: 20 });
    tree.bulkInsert([inNote1.commitment, inNote2.commitment]);

    const sign1 = signPoseidon(inNote1.commitment, account.privateKey);
    const sign2 = signPoseidon(inNote2.commitment, account.privateKey);

    const nullifier1 = poseidonHash(0, sign1.R8[0], sign1.R8[1], sign1.S);
    const nullifier2 = poseidonHash(1, sign2.R8[0], sign2.R8[1], sign2.S);

    const outNote1 = createNote({ address, value: 5 });
    const outNote2 = createNote({ address, value: 20 });
    const outPublicValue = 5;

    const inputs = {
      // ins
      root: BigNumber.from(tree.root).toHexString(),
      assetId: inNote1.assetId,
      inPublicValue: 0,
      inPublicKey: [account.publicKey, account.publicKey],
      inSignature: [
        [sign1.R8[0], sign1.R8[1], sign1.S],
        [sign2.R8[0], sign2.R8[1], sign2.S],
      ],
      inValue: [inNote1.value, inNote2.value],
      inSalt: [inNote1.salt, inNote2.salt],
      inNullifier: [nullifier1, nullifier2],
      inPathIndices: [0, 1],
      inPathElements: [tree.path(0).pathElements, tree.path(1).pathElements],
      // outs
      outPublicValue,
      outAddress: [outNote1.address, outNote2.address],
      outValue: [outNote1.value, outNote2.value],
      outSalt: [outNote1.salt, outNote2.salt],
      outCommitment: [outNote1.commitment, outNote2.commitment],
    };

    await assert.isFulfilled(circuit.calculateWitness(inputs, true));

    const witness = await circuit.calculateWitness(inputs, true);
    await circuit.checkConstraints(witness);
  });

  it('should fail transact for incorrect note properties', async function () {
    const address = account.address;
    const tree = getTree();
    const inNote1 = createNote({ address, value: 10 });
    const inNote2 = createNote({ address, value: 20 });
    tree.bulkInsert([inNote1.commitment, inNote2.commitment]);

    const sign1 = signPoseidon(inNote1.commitment, account.privateKey);
    const sign2 = signPoseidon(inNote2.commitment, account.privateKey);

    const nullifier1 = poseidonHash(0, sign1.R8[0], sign1.R8[1], sign1.S);
    const nullifier2 = poseidonHash(1, sign2.R8[0], sign2.R8[1], sign2.S);

    const outNote1 = createNote({ address, value: 5 });
    const outNote2 = createNote({ address, value: 20 });
    const outPublicValue = 5;

    const inputs = {
      // ins
      root: BigNumber.from(tree.root).toHexString(),
      assetId: inNote1.assetId,
      inPublicValue: 0,
      inPublicKey: [account.publicKey, account.publicKey],
      inSignature: [
        [sign1.R8[0], sign1.R8[1], sign1.S],
        [sign2.R8[0], sign2.R8[1], sign2.S],
      ],
      inValue: [inNote1.value, inNote2.value],
      inSalt: [inNote1.salt, randomHex(31)],
      inNullifier: [nullifier1, nullifier2],
      inPathIndices: [0, 1],
      inPathElements: [tree.path(0).pathElements, tree.path(1).pathElements],
      // outs
      outPublicValue,
      outAddress: [outNote1.address, outNote2.address],
      outValue: [outNote1.value, outNote2.value],
      outSalt: [outNote1.salt, outNote2.salt],
      outCommitment: [outNote1.commitment, outNote2.commitment],
    };

    const badAccount = randomAccount();
    const badAssetIdInputs = { ...inputs, assetId: randomHex(20) };
    const badInSaltInputs = { ...inputs, inPublicKey: [account.publicKey, randomHex(31)] };
    const badInValueInputs = { ...inputs, inValue: [inNote1.value, randomHex(8)] };
    const badInPublicKeyInputs = {
      ...inputs,
      inPublicKey: [account.publicKey, badAccount.publicKey],
    };
    const badInNullifierInputs = {
      ...inputs,
      inNullifier: [nullifier1, poseidonHash(randomHex(32))],
    };
    const badInPublicValueInputs = { ...inputs, inPublicValue: 1 };

    const badOutPublicValueInputs = { ...inputs, outPublicValue: 10 };
    const badOutAddressInputs = {
      ...inputs,
      outAddress: [outNote1.address, poseidonHash(randomHex(32))],
    };
    const badOutValue = { ...inputs, outValue: [outNote1.value, randomHex(8)] };
    const badOutSalt = { ...inputs, outSalt: [outNote1.salt, randomHex(31)] };
    const badOutCommitment = { ...inputs, outCommitment: [outNote1.commitment, randomHex(32)] };

    await assert.isRejected(circuit.calculateWitness(badAssetIdInputs, true), Error);
    await assert.isRejected(circuit.calculateWitness(badInSaltInputs, true), Error);
    await assert.isRejected(circuit.calculateWitness(badInValueInputs, true), Error);
    await assert.isRejected(circuit.calculateWitness(badInPublicKeyInputs, true), Error);
    await assert.isRejected(circuit.calculateWitness(badInNullifierInputs, true), Error);
    await assert.isRejected(circuit.calculateWitness(badInPublicValueInputs, true), Error);
    await assert.isRejected(circuit.calculateWitness(badOutPublicValueInputs, true), Error);
    await assert.isRejected(circuit.calculateWitness(badOutAddressInputs, true), Error);
    await assert.isRejected(circuit.calculateWitness(badOutValue, true), Error);
    await assert.isRejected(circuit.calculateWitness(badOutSalt, true), Error);
    await assert.isRejected(circuit.calculateWitness(badOutCommitment, true), Error);
  });

  it('should fail transact for incorrect proofs', async function () {
    const address = account.address;
    const tree = getTree();
    const inNote1 = createNote({ address, value: 10 });
    const inNote2 = createNote({ address, value: 20 });
    tree.bulkInsert([inNote1.commitment, inNote2.commitment, poseidonHash(randomHex(32))]);

    const sign1 = signPoseidon(inNote1.commitment, account.privateKey);
    const sign2 = signPoseidon(inNote2.commitment, account.privateKey);

    const nullifier1 = poseidonHash(0, sign1.R8[0], sign1.R8[1], sign1.S);
    const nullifier2 = poseidonHash(1, sign2.R8[0], sign2.R8[1], sign2.S);

    const outNote1 = createNote({ address, value: 5 });
    const outNote2 = createNote({ address, value: 20 });
    const outPublicValue = 5;

    const inputs = {
      // ins
      root: BigNumber.from(tree.root).toHexString(),
      assetId: inNote1.assetId,
      inPublicValue: 0,
      inPublicKey: [account.publicKey, account.publicKey],
      inSignature: [
        [sign1.R8[0], sign1.R8[1], sign1.S],
        [sign2.R8[0], sign2.R8[1], sign2.S],
      ],
      inValue: [inNote1.value, inNote2.value],
      inSalt: [inNote1.salt, randomHex(31)],
      inNullifier: [nullifier1, nullifier2],
      inPathIndices: [0, 1],
      inPathElements: [tree.path(0).pathElements, tree.path(1).pathElements],
      // outs
      outPublicValue,
      outAddress: [outNote1.address, outNote2.address],
      outValue: [outNote1.value, outNote2.value],
      outSalt: [outNote1.salt, outNote2.salt],
      outCommitment: [outNote1.commitment, outNote2.commitment],
    };

    const badAccount = randomAccount();
    const badSig2 = signPoseidon(inNote2.commitment, badAccount.privateKey);
    const badInSignatureInputs = {
      ...inputs,
      inSignature: [
        [sign1.R8[0], sign1.R8[1], sign1.S],
        [badSig2.R8[0], badSig2.R8[1], badSig2.S],
      ],
    };
    const badInPathIndices = { ...inputs, inPathIndices: [0, 2] };
    const badInPathElements = {
      ...inputs,
      inPathElements: [tree.path(0).pathElements, tree.path(2).pathElements],
    };

    await assert.isRejected(circuit.calculateWitness(badInSignatureInputs, true), Error);
    await assert.isRejected(circuit.calculateWitness(badInPathIndices, true), Error);
    await assert.isRejected(circuit.calculateWitness(badInPathElements, true), Error);
  });
});
