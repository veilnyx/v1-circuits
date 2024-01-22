import { concat, padHex, size, slice } from 'viem';
import { randomBigInt } from '@zkfi-tech/utils';
import { ff, Fp, Fr, Point, poseidonHash } from '@zkfi-tech/babyjubjub';
import { BigIntLike, HexString, BytesLike } from '@zkfi-tech/shared-types';

export function encrypt(message: BytesLike, publicKey: Point, entropy?: bigint) {
  const msg = Fp.strictFrom(message);
  if (!entropy) {
    entropy = randomBigInt(31);
  }
  if (!Fr.inRange(entropy)) {
    throw new Error('Entropy  out of range');
  }

  const r = Fp.from(entropy);

  // c1 = r.G
  const c1 = Point.generate(r.val);

  // h = H(r.P)
  const rP = publicKey.mul(r.val);
  const h = Fp.from(poseidonHash([rP.x, rP.y]));

  // c2 = m + h
  const c2 = msg.add(h);
  return concat([c1.pack(), padHex(c2.toHex(), { size: 32 })]) as HexString;
}

export function decrypt(ciphertext: HexString, privateKey: BigIntLike) {
  const byteSize = size(ciphertext);
  if (byteSize !== 64) {
    throw new Error('Ciphertext must be 64 bytes');
  }

  const pk = ff.parseStrict(privateKey, Fr.ORDER);

  // c1 = r.G
  const c1 = Point.unpack(slice(ciphertext, 0, 32));

  // c2 = m + h
  const c2 = Fp.from(slice(ciphertext, 32, 64));

  // h = H(r.P) = H(rp.G) = H(p.C1)
  const rpG = c1.mul(pk);
  const h = Fp.from(poseidonHash([rpG.x, rpG.y]));

  // m = c2 - h
  const msg = c2.sub(h);
  return msg.toBigInt();
}

const elGamal = { encrypt, decrypt };
export default elGamal;
