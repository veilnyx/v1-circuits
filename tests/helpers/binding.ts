import { poseidonHash } from '@veilnyx-sdk/babyjubjub';
import { sha256, toHex, concatHex, padHex } from 'viem';

/**
 * Ciphertext binding, mirroring `circuits/lib/transact.circom`.
 *
 * The circuit folds every public and encrypted field into a single array (`encryptedInputs`),
 * derives `beta` from it by chained Poseidon(2), and evaluates a universal hash at `alpha + beta`
 * to get `gamma`. `beta` and `gamma` are constrained in-circuit; `alpha` is not — it is a digest
 * computed outside the circuit so the contract can bind its calldata to the proof cheaply.
 */

const FIELD_MODULUS =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

/**
 * Assemble `encryptedInputs` in exactly the order transact.circom pushes onto it:
 * pubAssetIds, pubValues, inNullifiers, outCommitments, encryptedDataEncryptionKeySeed,
 * encryptedRefundData, then each encryptedNoteData row.
 */
export const getEncryptedInputs = ({
  pubAssetIds,
  pubValues,
  inNullifiers,
  outCommitments,
  encryptedDataEncryptionKeySeed,
  encryptedRefundData,
  encryptedNoteData,
}: {
  pubAssetIds: (bigint | number)[];
  pubValues: (bigint | number)[];
  inNullifiers: (bigint | number)[];
  outCommitments: (bigint | number)[];
  encryptedDataEncryptionKeySeed: (bigint | number)[];
  encryptedRefundData: (bigint | number)[];
  encryptedNoteData: (bigint | number)[][];
}): bigint[] =>
  [
    ...pubAssetIds,
    ...pubValues,
    ...inNullifiers,
    ...outCommitments,
    ...encryptedDataEncryptionKeySeed,
    ...encryptedRefundData,
    ...encryptedNoteData.flat(),
  ].map((x) => BigInt(x));

/** beta: chained Poseidon(2) over encryptedInputs, seeded with 0. */
export const getBeta = (encryptedInputs: bigint[]): bigint =>
  encryptedInputs.reduce((acc, x) => BigInt(poseidonHash([acc, x])), 0n);

/**
 * alpha: SHA256 over the same array, each element as a 32-byte big-endian word, reduced into
 * the field. The circuit leaves alpha unconstrained, so only its consistency with gamma matters.
 */
export const getAlpha = (encryptedInputs: bigint[]): bigint => {
  const packed = concatHex(encryptedInputs.map((x) => padHex(toHex(x), { size: 32 })));
  return BigInt(sha256(packed)) % FIELD_MODULUS;
};

/** gamma: universal hash — sum of encryptedInputs[i] * (alpha + beta)^i over the field. */
export const getGamma = (encryptedInputs: bigint[], alpha: bigint, beta: bigint): bigint => {
  const point = (alpha + beta) % FIELD_MODULUS;
  let acc = 0n;
  let coeff = 1n;
  for (const x of encryptedInputs) {
    acc = (acc + x * coeff) % FIELD_MODULUS;
    coeff = (coeff * point) % FIELD_MODULUS;
  }
  return acc;
};

/** Convenience: all three binding signals for a transact witness. */
export const getBindingSignals = (parts: Parameters<typeof getEncryptedInputs>[0]) => {
  const encryptedInputs = getEncryptedInputs(parts);
  const beta = getBeta(encryptedInputs);
  const alpha = getAlpha(encryptedInputs);
  const gamma = getGamma(encryptedInputs, alpha, beta);
  return { alpha, beta, gamma };
};
