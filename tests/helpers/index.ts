import { assert, expect } from 'chai';
import { BigNumber, BigNumberish, utils } from 'ethers';
import { BytesLike } from '@zkfi-tech/shared-types';
import { Point, schnorr, Fr, poseidonHash } from '@zkfi-tech/babyjubjub';
import { Fr as Frc } from './circuit';

export * from './circuit';
export * from './note';

// export const TxType = {
//   WITHDRAW: 0,
//   DEPOSIT: 1,
//   TRANSFER: 2,
// };

export const randomBN = (nBytes: number) => {
  return BigNumber.from(utils.randomBytes(nBytes));
};

export const randomHex = (nBytes: number) => {
  return randomBN(nBytes).toHexString();
};

export const randomKeyPair = () => {
  const privateKey = Fr.random(31).toHex();
  const publicKey = Point.generate(privateKey);

  return {
    privateKey,
    publicKey,
  };
};

export const randomAccount = () => {
  const signer = randomKeyPair();
  const viewer = randomKeyPair();

  return {
    signer,
    viewer,
    sign(message: BytesLike) {
      return schnorr.sign(message, signer.privateKey);
    },
    getStealthAddress(blinding: bigint | string) {
      return poseidonHash([this.signer.publicKey.x, this.signer.publicKey.y, blinding]);
    },
  };
};

export const isEqFe = (a: BigNumberish, b: BigNumberish) => Frc.eq(Frc.e(a), Frc.e(b));
export const assertEqFe = (a: BigNumberish, b: BigNumberish) => assert(isEqFe(a, b));
export const assertNeqFe = (a: BigNumberish, b: BigNumberish) => assert(!isEqFe(a, b));

export const expectEqFe = (a: BigNumberish, b: BigNumberish) =>
  expect(Frc.e(a).toString()).to.eq(Frc.e(b).toString());

export const expectNeqFe = (a: BigNumberish, b: BigNumberish) =>
  expect(Frc.e(a).toString()).to.not.eq(Frc.e(b).toString());
