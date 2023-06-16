import { assert, expect } from 'chai';
import { utils, BigNumber, BigNumberish } from 'ethers';
import { arrayify } from 'ethers/lib/utils';
//@ts-ignore
import { poseidon, eddsa } from 'xcircomlib';
import { fieldsSize, Fr } from './circuit';

export * from './circuit';
export * from './note';

export const randomBN = (nBytes: number) => {
  return BigNumber.from(utils.randomBytes(nBytes));
};

export const randomHex = (nBytes: number) => {
  return randomBN(nBytes).toHexString();
};

export const poseidonHash = (...inputs: BigNumberish[]): string => {
  const hexInputs = inputs.map((input) => BigNumber.from(input).toHexString());
  return BigNumber.from(poseidon([...hexInputs])).toHexString();
};

export const signPoseidon = (message: BigNumberish, privateKey: BigNumberish) => {
  const pkBuffer = Buffer.from(arrayify(BigNumber.from(privateKey)));
  const msgBuffer = BigNumber.from(message).mod(fieldsSize).toBigInt();
  const sign = eddsa.signPoseidon(pkBuffer, msgBuffer);

  return {
    R8: ['0x' + sign.R8[0].toString(16), '0x' + sign.R8[1].toString(16)],
    S: '0x' + sign.S.toString(16),
  };
};

export const getPublicKeyFromPrivateKey = (privateKey: BigNumberish) => {
  const pkBuffer = Buffer.from(arrayify(BigNumber.from(privateKey)));
  const pubKey = eddsa.prv2pub(pkBuffer);
  return ['0x' + pubKey[0].toString(16), '0x' + pubKey[1].toString(16)];
};

export const randomAccount = () => {
  const privateKey = poseidonHash(randomHex(32));
  const publicKey = getPublicKeyFromPrivateKey(privateKey);
  const address = poseidonHash(publicKey[0], publicKey[1]);
  return { privateKey, publicKey, address };
};

export const isEqFe = (a: BigNumberish, b: BigNumberish) => Fr.eq(Fr.e(a), Fr.e(b));
export const assertEqFe = (a: BigNumberish, b: BigNumberish) => assert(isEqFe(a, b));
export const assertNeqFe = (a: BigNumberish, b: BigNumberish) => assert(!isEqFe(a, b));

export const expectEqFe = (a: BigNumberish, b: BigNumberish) =>
  expect(Fr.e(a).toString()).to.eq(Fr.e(b).toString());

export const expectNeqFe = (a: BigNumberish, b: BigNumberish) =>
  expect(Fr.e(a).toString()).to.not.eq(Fr.e(b).toString());
