import { assert } from 'chai';
import { MerkleTree } from 'fixed-merkle-tree';
import { bytesToBigInt, parseEther, slice, toBytes } from 'viem';
import { Fr, Point, poseidonHash } from '@zkfi-tech/babyjubjub';
import { randomBigInt, randomHex } from '@zkfi-tech/utils';
import { createNote, getCircuit, randomAccount } from './helpers';
import { encodeAsset } from './helpers/asset';
import elGamal from './helpers/elGamal';

const eth = (n: number) => parseEther(`${n}`);
const getTree = () => new MerkleTree(20, [], { hashFunction: (a, b) => poseidonHash([a, b]) });

describe('transact', function () {
  this.timeout(8000);

  let circuit;
  let account;
  let publicKey;
  let owner;
  let blinding;
  let encPublicKey;

  let ft1 = 0x010001;
  let nft1 = 0x020002;

  before(async function () {
    circuit = await getCircuit('transact2I2O');
    account = randomAccount();
    blinding = Fr.random(32).toHex();
    owner = account.getStealthAddress(blinding);
    publicKey = account.signer.publicKey.toArray();
    encPublicKey = Point.generate(randomBigInt(31));
  });

  it('should transact with correct proofs', async function () {
    const tree = getTree();
    const hash = randomHex(31);
    const sign = account.sign(hash);
    const publicFlow = 1; // withdraw
    const publicValue = eth(5);

    const inNote1 = createNote({ owner, value: eth(10), assetId: ft1 });
    const inNote2 = createNote({ owner, value: eth(20), assetId: ft1 });
    tree.bulkInsert([inNote1.commitment, inNote2.commitment]);
    const nullifier1 = poseidonHash([0, inNote1.commitment, blinding]);
    const nullifier2 = poseidonHash([1, inNote2.commitment, blinding]);
    const outNote1 = createNote({ owner, value: eth(5), assetId: ft1 });
    const outNote2 = createNote({ owner, value: eth(20), assetId: ft1 });

    const ephKey = randomBigInt(31);
    const c1Packed = Point.generate(ephKey).pack();
    const assets = [
      encodeAsset(outNote1.assetId, outNote1.value),
      encodeAsset(outNote2.assetId, outNote2.value),
    ];
    const encAssets = assets.map((a) => {
      const ciphertext = elGamal.encrypt(a, encPublicKey, ephKey);
      return BigInt(slice(ciphertext, 32, 64));
    });

    const inputs = {
      merkleRoot: tree.root.toString(),
      hash,
      signature: [sign.s, sign.e],
      // public
      publicFlow,
      publicAssetIds: [ft1, ft1],
      publicValues: [publicValue, 0],
      // ins
      inPublicKey: publicKey,
      inAssetIds: [inNote1.assetId, inNote2.assetId],
      inValues: [inNote1.value, inNote2.value],
      inBlindings: [blinding, blinding],
      inNullifiers: [nullifier1, nullifier2],
      inPathIndices: [0, 1],
      inPathElements: [tree.path(0).pathElements, tree.path(1).pathElements],
      // outs
      outAssetIds: [outNote1.assetId, outNote2.assetId],
      outOwners: [outNote1.owner, outNote2.owner],
      outValues: [outNote1.value, outNote2.value],
      outCommitments: [outNote1.commitment, outNote2.commitment],
      // encryptions
      encPublicKey: encPublicKey.toArray(),
      ephKey,
      c1Packed: bytesToBigInt(toBytes(c1Packed).reverse()),
      encAssets,
    };
    await assert.isFulfilled(circuit.calculateWitness(inputs, true));
    const witness = await circuit.calculateWitness(inputs, true);
    await circuit.checkConstraints(witness);
  });

  //   it('should transact zero-value note skipping inclusion check', async function () {
  //     const tree = getTree();
  //     const inNote1 = createNote({ owner: owner, value: 10 });
  //     const inNote2 = createNote({ owner: owner, value: 0 });
  //     tree.insert(inNote1.commitment);

  //     const sign1 = signPoseidon(inNote1.commitment, spendKey);
  //     const sign2 = signPoseidon(inNote2.commitment, spendKey);

  //     const nullifier1 = poseidonHash(0, inNote1.commitment, viewKey);
  //     const nullifier2 = poseidonHash(0, inNote2.commitment, viewKey);

  //     const outNote1 = createNote({ owner: owner, value: 2 });
  //     const outNote2 = createNote({ owner: owner, value: 7 });
  //     const outPublicValue = 1;

  //     const inputs = {
  //       // ins
  //       root: BigNumber.from(tree.root).toHexString(),
  //       assetId: inNote1.assetId,
  //       viewKey,
  //       inPublicValue: 0,
  //       inPublicKey: [publicKey, publicKey],
  //       inSignature: [
  //         [sign1.s, sign1.e],
  //         [sign2.s, sign2.e],
  //       ],
  //       inValue: [inNote1.value, inNote2.value],
  //       inBlinding: [blinding, blinding],
  //       inNullifier: [nullifier1, nullifier2],
  //       inPathIndices: [0, 0],
  //       inPathElements: [tree.path(0).pathElements, Array.from({ length: tree.levels }).fill(0)],
  //       // outs
  //       outPublicValue,
  //       outOwner: [outNote1.owner, outNote2.owner],
  //       outValue: [outNote1.value, outNote2.value],
  //       outCommitment: [outNote1.commitment, outNote2.commitment],
  //     };

  //     // await assert.isFulfilled(circuit.calculateWitness(inputs, true));

  //     const witness = await circuit.calculateWitness(inputs, true);
  //     await circuit.checkConstraints(witness);
  //   });

  //   it('should fail transact for incorrect note properties', async function () {
  //     const address = account.address;
  //     const tree = getTree();
  //     const inNote1 = createNote({ owner: address, value: 10 });
  //     const inNote2 = createNote({ owner: address, value: 20 });
  //     tree.bulkInsert([inNote1.commitment, inNote2.commitment]);

  //     const sign1 = signPoseidon(inNote1.commitment, spendKey);
  //     const sign2 = signPoseidon(inNote2.commitment, spendKey);

  //     const nullifier1 = poseidonHash(0, inNote1.commitment, viewKey);
  //     const nullifier2 = poseidonHash(1, inNote2.commitment, viewKey);

  //     const outNote1 = createNote({ owner: address, value: 5 });
  //     const outNote2 = createNote({ owner: address, value: 20 });
  //     const outPublicValue = 5;

  //     const inputs = {
  //       // ins
  //       root: BigNumber.from(tree.root).toHexString(),
  //       assetId: inNote1.assetId,
  //       viewKey,
  //       inPublicValue: 0,
  //       inPublicKey: [publicKey, publicKey],
  //       inSignature: [
  //         [sign1.s, sign1.e],
  //         [sign2.s, sign2.e],
  //       ],
  //       inValue: [inNote1.value, inNote2.value],
  //       inBlinding: [blinding, blinding],
  //       inNullifier: [nullifier1, nullifier2],
  //       inPathIndices: [0, 1],
  //       inPathElements: [tree.path(0).pathElements, tree.path(1).pathElements],
  //       // outs
  //       outPublicValue,
  //       outAddress: [outNote1.owner, outNote2.owner],
  //       outValue: [outNote1.value, outNote2.value],
  //       outCommitment: [outNote1.commitment, outNote2.commitment],
  //     };

  //     const badAccount = randomAccount();
  //     const badAssetIdInputs = { ...inputs, assetId: randomHex(20) };
  //     const badInSaltInputs = { ...inputs, inPublicKey: [publicKey, randomHex(31)] };
  //     const badInValueInputs = { ...inputs, inValue: [inNote1.value, randomHex(8)] };
  //     const badInPublicKeyInputs = {
  //       ...inputs,
  //       inPublicKey: [publicKey, badAccount.publicKey],
  //     };
  //     const badInNullifierInputs = {
  //       ...inputs,
  //       inNullifier: [nullifier1, poseidonHash(randomHex(32))],
  //     };
  //     const badInPublicValueInputs = { ...inputs, inPublicValue: 1 };

  //     const badOutPublicValueInputs = { ...inputs, outPublicValue: 10 };
  //     const badOutAddressInputs = {
  //       ...inputs,
  //       outAddress: [outNote1.owner, poseidonHash(randomHex(32))],
  //     };
  //     const badOutValue = { ...inputs, outValue: [outNote1.value, randomHex(8)] };
  //     const badOutCommitment = { ...inputs, outCommitment: [outNote1.commitment, randomHex(32)] };

  //     await assert.isRejected(circuit.calculateWitness(badAssetIdInputs, true), Error);
  //     await assert.isRejected(circuit.calculateWitness(badInSaltInputs, true), Error);
  //     await assert.isRejected(circuit.calculateWitness(badInValueInputs, true), Error);
  //     await assert.isRejected(circuit.calculateWitness(badInPublicKeyInputs, true), Error);
  //     await assert.isRejected(circuit.calculateWitness(badInNullifierInputs, true), Error);
  //     await assert.isRejected(circuit.calculateWitness(badInPublicValueInputs, true), Error);
  //     await assert.isRejected(circuit.calculateWitness(badOutPublicValueInputs, true), Error);
  //     await assert.isRejected(circuit.calculateWitness(badOutAddressInputs, true), Error);
  //     await assert.isRejected(circuit.calculateWitness(badOutValue, true), Error);
  //     await assert.isRejected(circuit.calculateWitness(badOutCommitment, true), Error);
  //   });

  //   it('should fail transact for incorrect proofs', async function () {
  //     const address = account.address;
  //     const tree = getTree();
  //     const inNote1 = createNote({ owner: address, value: 10 });
  //     const inNote2 = createNote({ owner: address, value: 20 });
  //     tree.bulkInsert([inNote1.commitment, inNote2.commitment, poseidonHash(randomHex(32))]);

  //     const sign1 = signPoseidon(inNote1.commitment, spendKey);
  //     const sign2 = signPoseidon(inNote2.commitment, spendKey);

  //     const nullifier1 = poseidonHash(0, inNote1.commitment, viewKey);
  //     const nullifier2 = poseidonHash(1, inNote2.commitment, viewKey);

  //     const outNote1 = createNote({ owner: address, value: 5 });
  //     const outNote2 = createNote({ owner: address, value: 20 });
  //     const outPublicValue = 5;

  //     const inputs = {
  //       // ins
  //       root: BigNumber.from(tree.root).toHexString(),
  //       assetId: inNote1.assetId,
  //       viewKey,
  //       inPublicValue: 0,
  //       inPublicKey: [publicKey, publicKey],
  //       inSignature: [
  //         [sign1.s, sign1.e],
  //         [sign2.s, sign2.e],
  //       ],
  //       inValue: [inNote1.value, inNote2.value],
  //       inBlinding: [blinding, blinding],
  //       inNullifier: [nullifier1, nullifier2],
  //       inPathIndices: [0, 1],
  //       inPathElements: [tree.path(0).pathElements, tree.path(1).pathElements],
  //       // outs
  //       outPublicValue,
  //       outAddress: [outNote1.owner, outNote2.owner],
  //       outValue: [outNote1.value, outNote2.value],
  //       outCommitment: [outNote1.commitment, outNote2.commitment],
  //     };

  //     const badAccount = randomAccount();
  //     const badSig2 = signPoseidon(inNote2.commitment, badAccount.privateKey);
  //     const badInSignatureInputs = {
  //       ...inputs,
  //       inSignature: [[sign1.s, sign1.e][(badSig2.s, badSig2.e)]],
  //     };
  //     const badInPathIndices = { ...inputs, inPathIndices: [0, 2] };
  //     const badInPathElements = {
  //       ...inputs,
  //       inPathElements: [tree.path(0).pathElements, tree.path(2).pathElements],
  //     };

  //     await assert.isRejected(circuit.calculateWitness(badInSignatureInputs, true), Error);
  //     await assert.isRejected(circuit.calculateWitness(badInPathIndices, true), Error);
  //     await assert.isRejected(circuit.calculateWitness(badInPathElements, true), Error);
  //   });
});
