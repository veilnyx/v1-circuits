import { Account, Fp } from '@zkfi-tech/v1-sdk/src';
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
  let publicKey;
  let address;
  let viewKey;
  let spendKey;

  before(async function () {
    circuit = await getCircuit('transact');
    account = Account.random();
    const entropy = Fp.random(32);
    const xData = account.generateStealthData(entropy);
    publicKey = xData.publicKey.toArray();
    address = xData.address;
    spendKey = account.deriveStealthSigner(xData).privateKey;
    viewKey = account.viewer.privateKey;
  });

  it('should transact with correct proofs', async function () {
    const tree = getTree();
    const inNote1 = createNote({ owner: address, value: 10 });
    const inNote2 = createNote({ owner: address, value: 20 });
    tree.bulkInsert([inNote1.commitment, inNote2.commitment]);

    const sign1 = signPoseidon(inNote1.commitment, spendKey);
    const sign2 = signPoseidon(inNote2.commitment, spendKey);

    const nullifier1 = poseidonHash(0, inNote1.commitment, viewKey);
    const nullifier2 = poseidonHash(1, inNote2.commitment, viewKey);

    const outNote1 = createNote({ owner: address, value: 5 });
    const outNote2 = createNote({ owner: address, value: 20 });
    const outPublicValue = 5;

    const inputs = {
      // ins
      root: BigNumber.from(tree.root).toHexString(),
      assetId: inNote1.assetId,
      viewKey,
      inPublicValue: 0,
      inPublicKey: [publicKey, publicKey],
      inSignature: [
        [sign1.s, sign1.e],
        [sign2.s, sign2.e],
      ],
      inValue: [inNote1.value, inNote2.value],
      inNullifier: [nullifier1, nullifier2],
      inPathIndices: [0, 1],
      inPathElements: [tree.path(0).pathElements, tree.path(1).pathElements],
      // outs
      outPublicValue,
      outOwner: [outNote1.owner, outNote2.owner],
      outValue: [outNote1.value, outNote2.value],
      outCommitment: [outNote1.commitment, outNote2.commitment],
    };

    await assert.isFulfilled(circuit.calculateWitness(inputs, true));

    const witness = await circuit.calculateWitness(inputs, true);
    await circuit.checkConstraints(witness);
  });

  it('should transact zero-value note skipping inclusion check', async function () {
    const tree = getTree();
    const inNote1 = createNote({ owner: address, value: 10 });
    const inNote2 = createNote({ owner: address, value: 0 });
    tree.insert(inNote1.commitment);

    const sign1 = signPoseidon(inNote1.commitment, spendKey);
    const sign2 = signPoseidon(inNote2.commitment, spendKey);

    const nullifier1 = poseidonHash(0, inNote1.commitment, viewKey);
    const nullifier2 = poseidonHash(0, inNote2.commitment, viewKey);

    const outNote1 = createNote({ owner: address, value: 2 });
    const outNote2 = createNote({ owner: address, value: 7 });
    const outPublicValue = 1;

    const inputs = {
      // ins
      root: BigNumber.from(tree.root).toHexString(),
      assetId: inNote1.assetId,
      viewKey,
      inPublicValue: 0,
      inPublicKey: [publicKey, publicKey],
      inSignature: [
        [sign1.s, sign1.e],
        [sign2.s, sign2.e],
      ],
      inValue: [inNote1.value, inNote2.value],
      inNullifier: [nullifier1, nullifier2],
      inPathIndices: [0, 0],
      inPathElements: [tree.path(0).pathElements, Array.from({ length: tree.levels }).fill(0)],
      // outs
      outPublicValue,
      outOwner: [outNote1.owner, outNote2.owner],
      outValue: [outNote1.value, outNote2.value],
      outCommitment: [outNote1.commitment, outNote2.commitment],
    };

    // await assert.isFulfilled(circuit.calculateWitness(inputs, true));

    const witness = await circuit.calculateWitness(inputs, true);
    await circuit.checkConstraints(witness);
  });

  it('should fail transact for incorrect note properties', async function () {
    const address = account.address;
    const tree = getTree();
    const inNote1 = createNote({ owner: address, value: 10 });
    const inNote2 = createNote({ owner: address, value: 20 });
    tree.bulkInsert([inNote1.commitment, inNote2.commitment]);

    const sign1 = signPoseidon(inNote1.commitment, spendKey);
    const sign2 = signPoseidon(inNote2.commitment, spendKey);

    const nullifier1 = poseidonHash(0, inNote1.commitment, viewKey);
    const nullifier2 = poseidonHash(1, inNote2.commitment, viewKey);

    const outNote1 = createNote({ owner: address, value: 5 });
    const outNote2 = createNote({ owner: address, value: 20 });
    const outPublicValue = 5;

    const inputs = {
      // ins
      root: BigNumber.from(tree.root).toHexString(),
      assetId: inNote1.assetId,
      viewKey,
      inPublicValue: 0,
      inPublicKey: [publicKey, publicKey],
      inSignature: [
        [sign1.s, sign1.e],
        [sign2.s, sign2.e],
      ],
      inValue: [inNote1.value, inNote2.value],
      inNullifier: [nullifier1, nullifier2],
      inPathIndices: [0, 1],
      inPathElements: [tree.path(0).pathElements, tree.path(1).pathElements],
      // outs
      outPublicValue,
      outAddress: [outNote1.owner, outNote2.owner],
      outValue: [outNote1.value, outNote2.value],
      outCommitment: [outNote1.commitment, outNote2.commitment],
    };

    const badAccount = randomAccount();
    const badAssetIdInputs = { ...inputs, assetId: randomHex(20) };
    const badInSaltInputs = { ...inputs, inPublicKey: [publicKey, randomHex(31)] };
    const badInValueInputs = { ...inputs, inValue: [inNote1.value, randomHex(8)] };
    const badInPublicKeyInputs = {
      ...inputs,
      inPublicKey: [publicKey, badAccount.publicKey],
    };
    const badInNullifierInputs = {
      ...inputs,
      inNullifier: [nullifier1, poseidonHash(randomHex(32))],
    };
    const badInPublicValueInputs = { ...inputs, inPublicValue: 1 };

    const badOutPublicValueInputs = { ...inputs, outPublicValue: 10 };
    const badOutAddressInputs = {
      ...inputs,
      outAddress: [outNote1.owner, poseidonHash(randomHex(32))],
    };
    const badOutValue = { ...inputs, outValue: [outNote1.value, randomHex(8)] };
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
    await assert.isRejected(circuit.calculateWitness(badOutCommitment, true), Error);
  });

  it('should fail transact for incorrect proofs', async function () {
    const address = account.address;
    const tree = getTree();
    const inNote1 = createNote({ owner: address, value: 10 });
    const inNote2 = createNote({ owner: address, value: 20 });
    tree.bulkInsert([inNote1.commitment, inNote2.commitment, poseidonHash(randomHex(32))]);

    const sign1 = signPoseidon(inNote1.commitment, spendKey);
    const sign2 = signPoseidon(inNote2.commitment, spendKey);

    const nullifier1 = poseidonHash(0, inNote1.commitment, viewKey);
    const nullifier2 = poseidonHash(1, inNote2.commitment, viewKey);

    const outNote1 = createNote({ owner: address, value: 5 });
    const outNote2 = createNote({ owner: address, value: 20 });
    const outPublicValue = 5;

    const inputs = {
      // ins
      root: BigNumber.from(tree.root).toHexString(),
      assetId: inNote1.assetId,
      viewKey,
      inPublicValue: 0,
      inPublicKey: [publicKey, publicKey],
      inSignature: [
        [sign1.s, sign1.e],
        [sign2.s, sign2.e],
      ],
      inValue: [inNote1.value, inNote2.value],
      inNullifier: [nullifier1, nullifier2],
      inPathIndices: [0, 1],
      inPathElements: [tree.path(0).pathElements, tree.path(1).pathElements],
      // outs
      outPublicValue,
      outAddress: [outNote1.owner, outNote2.owner],
      outValue: [outNote1.value, outNote2.value],
      outCommitment: [outNote1.commitment, outNote2.commitment],
    };

    const badAccount = randomAccount();
    const badSig2 = signPoseidon(inNote2.commitment, badAccount.privateKey);
    const badInSignatureInputs = {
      ...inputs,
      inSignature: [[sign1.s, sign1.e][(badSig2.s, badSig2.e)]],
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
