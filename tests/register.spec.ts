import chai, { assert } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Point } from '@veilnyx-sdk/babyjubjub';
import { randomBigInt } from '@veilnyx-sdk/utils';
import { getCircuit, MSG_ASSERT_FAILED, randomAccount, pointToArray, sha256Fields } from './helpers';

chai.use(chaiAsPromised);

const REGISTRANT = BigInt('0xCD1722F3947DEf4Cf144679Da39c4c32BDC35681');

describe('register', function () {
  this.timeout(60000);
  let circuit: any;
  before(async () => {
    circuit = await getCircuit('register');
  });

  const inputsFor = (acc: ReturnType<typeof randomAccount>, publicAddress = REGISTRANT) => {
    const signPublicKey = pointToArray(acc.signer.publicKey);
    const viewPublicKey = pointToArray(acc.viewer.publicKey);
    return {
      rootAddress: acc.rootAddress,
      signPublicKey,
      viewPublicKey,
      viewPrivateKey: acc.viewer.privateKey,
      publicAddress,
      inputsHash: sha256Fields([acc.rootAddress, ...signPublicKey, ...viewPublicKey, publicAddress]),
    };
  };

  it('successfully verify well-formed root address', async function () {
    const witness = await circuit.calculateWitness(inputsFor(randomAccount()), true);
    await circuit.checkConstraints(witness);
  });

  it('fail verification for malformed root address', async function () {
    const acc = randomAccount();
    const inputs = inputsFor(acc);
    const viewPublicKey = pointToArray(Point.generate(randomBigInt(31)));
    const bad = {
      ...inputs,
      viewPublicKey,
      inputsHash: sha256Fields([acc.rootAddress, ...inputs.signPublicKey, ...viewPublicKey, REGISTRANT]),
    };
    await assert.isRejected(circuit.calculateWitness(bad, true), MSG_ASSERT_FAILED);
  });

  // Each bound value: the contract hashes its own copy; a proof made for a different
  // value must not verify against it.
  (['rootAddress', 'signPublicKey', 'viewPublicKey', 'publicAddress'] as const).forEach((field) => {
    it(`rejects an inputsHash computed over a different ${field}`, async function () {
      const acc = randomAccount();
      const inputs = inputsFor(acc);
      const words: bigint[] = [
        BigInt(inputs.rootAddress),
        ...inputs.signPublicKey,
        ...inputs.viewPublicKey,
        inputs.publicAddress,
      ];
      const k = { rootAddress: 0, signPublicKey: 1, viewPublicKey: 3, publicAddress: 5 }[field];
      words[k] = words[k] + 1n;
      await assert.isRejected(
        circuit.calculateWitness({ ...inputs, inputsHash: sha256Fields(words) }, true),
        MSG_ASSERT_FAILED,
      );
    });
  });
});
