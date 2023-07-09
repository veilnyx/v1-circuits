import { assert, expect } from 'chai';
import { utils, BigNumber, BigNumberish } from 'ethers';
//@ts-ignore
import { poseidon } from 'xcircomlib';
import { fieldsSize, Fr } from './circuit';
import { schnorr } from './schnorr';

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
  const pkBuffer = BigNumber.from(privateKey).toBigInt();
  const msgBuffer = BigNumber.from(message).mod(fieldsSize).toBigInt();
  const k = randomHex(31);
  const sign = schnorr.signPoseidon(pkBuffer, msgBuffer, k);

  return {
    e: '0x' + sign.e.toString(16),
    s: '0x' + sign.s.toString(16),
  };
};

export const getPublicKeyFromPrivateKey = (privateKey: BigNumberish) => {
  const pkBuffer = BigNumber.from(privateKey).toBigInt();
  const pubKey = schnorr.prv2pub(pkBuffer);
  return ['0x' + pubKey[0].toString(16), '0x' + pubKey[1].toString(16)];
};

export const randomAccount = () => {
  const privateKey = poseidonHash(randomHex(31));
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
