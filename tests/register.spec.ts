import { assert } from 'chai';
import { Point } from '@veilnyx-sdk/babyjubjub';
import { randomBigInt } from '@veilnyx-sdk/utils';
import { getCircuit, MSG_ASSERT_FAILED, randomAccount,
  pointToArray,
} from './helpers';

describe('register', function () {
  it('successfully verify well-formed root address', async function () {
    const circuit = await getCircuit('register');
    const acc = randomAccount();

    const inputs = {
      rootAddress: acc.rootAddress,
      signPublicKey: pointToArray(acc.signer.publicKey),
      viewPublicKey: pointToArray(acc.viewer.publicKey),
      viewPrivateKey: acc.viewer.privateKey,
      // Binds the proof to the registrant; see register.circom.
      publicAddress: BigInt('0xCD1722F3947DEf4Cf144679Da39c4c32BDC35681'),
    };

    assert.isFulfilled(circuit.calculateWitness(inputs, true));
    const witness = await circuit.calculateWitness(inputs, true);
    await circuit.checkConstraints(witness);
  });

  it('fail verification for malformed root address', async function () {
    const circuit = await getCircuit('register');
    const acc = randomAccount();

    const inputs = {
      rootAddress: acc.rootAddress,
      signPublicKey: pointToArray(acc.signer.publicKey),
      viewPublicKey: pointToArray(Point.generate(randomBigInt(31))),
      viewPrivateKey: acc.viewer.privateKey,
      publicAddress: BigInt('0xCD1722F3947DEf4Cf144679Da39c4c32BDC35681'),
    };

    assert.isRejected(circuit.calculateWitness(inputs, true), MSG_ASSERT_FAILED);
  });
});
