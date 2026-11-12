import { assert } from 'chai';
import { parseEther } from 'viem';
import { poseidonEncrypt } from '@veilnyx-sdk/babyjubjub';
import { Point, elGamal } from '@veilnyx-sdk/babyjubjub';
import { randomBigInt } from '@veilnyx-sdk/utils';
import {
  NoteData,
  createNote,
  deriveKeys,
  getCircuit,
  getMerkleTree,
  randomAccount,
  toPaddedHex,
  pointToArray,
  getBindingSignals,
  getEncryptedInputs,
  getAlpha,
  getBeta,
  getGamma,
  HEADER_LABELS,
} from './helpers';
import { encodeAsset } from './helpers/asset';

const eth = (n: number) => parseEther(`${n}`);

const cmTreeDepth = 32;
const addrTreeDepth = 20;
const getCmTree = () => getMerkleTree(cmTreeDepth);
const getAddrTree = () => getMerkleTree(addrTreeDepth);

describe('transact', function () {
  this.timeout(8000);

  let circuit;
  // binding parts of the last createTx call, for the binding tests below
  let lastParts: Parameters<typeof getEncryptedInputs>[0];
  const sender = randomAccount();
  const receiver = randomAccount();
  const revokerPublicKey = Point.generate(randomBigInt(31));
  const keySeedEncryptionPublicKey = Point.generate(randomBigInt(31));
  const dataEncryptionKeySeed = randomBigInt(31);

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
    const hash = randomBigInt(31);
    const sign = sender.sign(hash);

    const refundAddressBlinding = randomBigInt(31);
    const refundAddress = sender.getBlindedAddress(revokerPublicKey, refundAddressBlinding);

    const keySeedEncryptionEphemeralKey = randomBigInt(31);
    const ephemeralPublicKey = Point.generate(keySeedEncryptionEphemeralKey);
    const encryptedDataEncryptionKeySeed = elGamal.encrypt(
      dataEncryptionKeySeed,
      keySeedEncryptionPublicKey,
      keySeedEncryptionEphemeralKey,
    );

    const numNotes = outNotes.length;
    const dataEncryptionPrivateKeys = deriveKeys(dataEncryptionKeySeed, numNotes + 1);
    const dataEncryptionPublicKeys = dataEncryptionPrivateKeys.map((k) => Point.generate(k));
    const assets = outNotes.map((n) => encodeAsset(n.assetId, n.value));
    const refundData = [sender.rootAddress, refundAddressBlinding];
    const noteData = outNotes.map((n, i) => [assets[i], n.rootAddress, n.blinding]);
    const [encryptedRefundData, ...encryptedNoteData] = [refundData, ...noteData].map((d, i) => {
      return poseidonEncrypt(d, dataEncryptionPublicKeys[i], BigInt(0));
    });

    const pubAssetIds = [ft1, ft1];
    const inNullifiers = inNotes.map((note: any) => note.nullifier);
    const outCommitments = outNotes.map((note: any) => note.commitment);

    // beta and gamma are constrained in-circuit, so the witness only closes if the test
    // reproduces the circuit's own folding of the public and encrypted fields.
    lastParts = {
      header: {
        addressTreeRoot: addressTree.root.toString(),
        commitmentTreeRoot: commitmentsTree.root.toString(),
        hash,
        pubFlow,
        outRevokerPublicKey: pointToArray(revokerPublicKey),
        refundAddress,
        keySeedEncryptionPublicKey: pointToArray(keySeedEncryptionPublicKey),
      },
      pubAssetIds,
      pubValues,
      inNullifiers,
      outCommitments,
      encryptedDataEncryptionKeySeed,
      encryptedRefundData,
      encryptedNoteData,
    };
    const { alpha, beta, gamma } = getBindingSignals(lastParts);

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
      pubAssetIds,
      pubValues: pubValues,
      // ins
      inViewPrivateKey: sender.viewer.privateKey,
      inSignPublicKey: pointToArray(sender.signer.publicKey),
      inRevokerPublicKeys: inNotes.map(() => pointToArray(revokerPublicKey)),
      inAssetIds: inNotes.map((note: any) => note.assetId),
      inValues: inNotes.map((note: any) => note.value),
      inBlindings: inNotes.map((note: any) => note.blinding),
      inNullifiers,
      inPathIndices: inNotes.map((n) => n.leafIndex),
      inPathElements: inNotes.map((n) => commitmentsTree.path(n.leafIndex).pathElements),
      // outs
      outRevokerPublicKey: pointToArray(revokerPublicKey),
      outAssetIds: outNotes.map((note: any) => note.assetId),
      outRootAddresses: outNotes.map((note: any) => note.rootAddress),
      outValues: outNotes.map((note: any) => note.value),
      outBlindings: outNotes.map((note: any) => note.blinding),
      outCommitments,
      // refund address
      refundAddress,
      refundAddressBlinding,
      // encryptions
      keySeedEncryptionEphemeralKey,
      keySeedEncryptionPublicKey: pointToArray(keySeedEncryptionPublicKey),
      dataEncryptionKeySeed,
      encryptedDataEncryptionKeySeed,
      encryptedRefundData,
      encryptedNoteData,
      alpha,
      beta,
      gamma,
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

  describe('binding of the folded public inputs', function () {
    // The 9 header values are private now. The contract computes alpha and gamma from ITS
    // values (calldata, storage, revoker registry); the prover supplies beta. A prover holding
    // a witness for a different header value must not be able to satisfy gamma.
    const transfer = () => {
      const inNotes = [0, 1].map((leafIndex) =>
        createNote({ account: sender, revokerPublicKey, value: eth(10), assetId: ft1, leafIndex }),
      );
      const outNotes = [2, 3].map((leafIndex) =>
        createNote({ account: receiver, revokerPublicKey, value: eth(10), assetId: ft1, leafIndex }),
      );
      return createTx({ pubFlow: 1, inNotes, outNotes, pubValues: [eth(0), eth(0)] });
    };

    HEADER_LABELS.forEach((label, k) => {
      it(`rejects a proof whose ${label} differs from the contract's value`, async function () {
        const inputs = transfer();
        const proverD = getEncryptedInputs(lastParts);
        const contractD = [...proverD];
        contractD[k] = contractD[k] + 1n;

        const beta = getBeta(proverD); // the circuit forces beta = Poseidon(prover's D)
        const alpha = getAlpha(contractD); // computed on-chain
        const gamma = getGamma(contractD, alpha, beta); // computed on-chain

        await assert.isRejected(circuit.calculateWitness({ ...inputs, alpha, beta, gamma }, true));

        // control: the same alpha with the prover's own gamma closes, so the rejection
        // above comes from the header mismatch alone
        const ownGamma = getGamma(proverD, alpha, beta);
        await assert.isFulfilled(
          circuit.calculateWitness({ ...inputs, alpha, beta, gamma: ownGamma }, true),
        );
      });
    });
  });
});
