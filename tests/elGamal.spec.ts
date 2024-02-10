import { expect } from 'chai';
import { bytesToBigInt, hexToBytes, slice, sliceHex, toBytes } from 'viem';
import { Fr, Point } from '@zkfi-tech/babyjubjub';
import { hexFixed, randomBigInt } from '@zkfi-tech/utils';
import { getCircuit } from './helpers';
import elGamal from './helpers/elGamal';

describe('elGamal', () => {
  let circuit1;
  let circuit2;

  before(async function () {
    circuit1 = await getCircuit('elGamal');
    circuit2 = await getCircuit('elGamalMulti');
  });

  it('should encrypt and decrypt', () => {
    const msg = randomBigInt(31);
    const privateKey = Fr.random(31).toBigInt();
    const publicKey = Point.generate(privateKey);
    const ciphertext = elGamal.encrypt(msg, publicKey);
    const decrypted = elGamal.decrypt(ciphertext, privateKey);
    expect(decrypted).to.equal(msg);
  });

  it('should verify encryption in circuit', async () => {
    const message = randomBigInt(31);
    // const privateKey = Fr.random(31).val;
    const privateKey = BigInt(
      '196518003492553066139678792251928226250371319451207574335728467391529880337',
    );
    // console.log('privateKey', hexFixed(privateKey, 32));

    const encPubKey = Point.generate(privateKey);

    // const ephKey = Fr.random(31).val;
    const ephKey = BigInt(
      '150570417234977204982824727512920177646362186483917498762815989539640043327',
    );
    const ephPubKey = Point.generate(ephKey);

    const ciphertext = elGamal.encrypt(message, encPubKey, ephKey);

    const ephPubKeyPacked = BigInt(sliceHex(ciphertext, 0, 32));
    expect(Point.unpack(ephPubKeyPacked).eq(ephPubKey)).to.be.true;

    const c1PackedR = bytesToBigInt(toBytes(ephPubKeyPacked).reverse());

    const c = BigInt(sliceHex(ciphertext, 32, 64));
    const inputs = {
      ephKey,
      ephPubKeyPacked: c1PackedR,
      encPubKey: [encPubKey.x, encPubKey.y],
      m: message,
      c,
    };

    const witness = await circuit1.calculateWitness(inputs, true);
  });

  it('should verify multi encryption in circuit', async () => {
    const messages = [randomBigInt(31), randomBigInt(31), randomBigInt(31)];
    const privateKey = Fr.random(31).toBigInt();
    const encPubKey = Point.generate(privateKey);
    const ephKey = Fr.random(31).toBigInt();
    const ephPubKey = Point.generate(ephKey);
    const ciphertexts = messages.map((m) => elGamal.encrypt(m, encPubKey, ephKey));

    const ephPubKeyPacked = BigInt(slice(ciphertexts[0], 0, 32));
    expect(Point.unpack(ephPubKeyPacked).eq(ephPubKey)).to.be.true;

    const c = ciphertexts.map((c) => BigInt(slice(c, 32, 64)));

    // Note: circuit expects c1Packed to be in big endian order whereas, Point.pack()
    // returns it in little endian order
    const c1PackedR = bytesToBigInt(toBytes(ephPubKeyPacked).reverse());

    const inputs = {
      ephKey,
      ephPubKeyPacked: c1PackedR,
      encPubKey: [encPubKey.x, encPubKey.y],
      m: messages,
      c,
    };

    const witness = await circuit2.calculateWitness(inputs, true);
  });
});
