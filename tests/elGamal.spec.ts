import { expect } from 'chai';
import { Point, elGamal } from '@veilnyx-sdk/babyjubjub';
import { randomBigInt } from '@veilnyx-sdk/utils';
import { getCircuit,
  pointToArray,
} from './helpers';

describe('elGamal', () => {
  let circuit1;

  before(async function () {
    circuit1 = await getCircuit('elGamal');
  });

  it('should verify encryption in circuit', async () => {
    const message = randomBigInt(31);
    const privateKey = BigInt(
      '196518003492553066139678792251928226250371319451207574335728467391529880337',
    );

    const encryptionPublicKey = Point.generate(privateKey);
    const ephemeralKey = randomBigInt(31);
    const ephemeralPublicKey = Point.generate(ephemeralKey);

    const ciphertext = elGamal.encrypt(message, encryptionPublicKey, ephemeralKey);

    const c = ciphertext[2];
    const inputs = {
      ephemeralKey,
      ephemeralPublicKey: pointToArray(ephemeralPublicKey),
      encryptionPublicKey: pointToArray(encryptionPublicKey),
      m: message,
    };

    const witness = await circuit1.calculateWitness(inputs, true);
    expect(witness[1]).to.equal(c);
  });
});
