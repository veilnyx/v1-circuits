// SPDX-License-Identifier: LicenseRef-BUSL-1.1
// Copyright (c) 2026 Gelbfeld AG. Licensed under the Business Source License 1.1.
// See /licenses/BUSL_LICENSE. Not for use in a Production Environment.

pragma circom 2.1.6;

include "../../node_modules/circomlib/circuits/bitify.circom";
include "../../node_modules/circomlib/circuits/compconstant.circom";
include "../../node_modules/circomlib/circuits/escalarmulany.circom";
include "../../node_modules/circomlib/circuits/poseidon.circom";
include "./constants.circom";

// Using encoding free hashed el gamal encryption that uses addition
// See: https://www.di.ens.fr/david.pointcheval/Documents/Papers/2006_pkcC.pdf
template ElGamalEncrypt() {
    // Ephemeral key, (r)
    signal input ephemeralKey;

    // Ephemeral public key (R)
    signal input ephemeralPublicKey[2];

    // Encryption key (P)
    signal input encryptionPublicKey[2];

    // Message
    signal input m;

    // Ciphertext
    signal output out;

    var BASE8[2] = GetBase8Point();
    var SUBGROUP_ORDER = GetSubgroupOrder();

    component ephemeralKeyBits = Num2Bits_strict();
    ephemeralKeyBits.in <== ephemeralKey;

    // Assert r < SUBGROUP_ORDER
    component comp = CompConstant(SUBGROUP_ORDER - 1);
    comp.in <== ephemeralKeyBits.out;
    comp.out === 0;

    // Caclulate R = r.G
    component ephemeralKeyMulG = EscalarMulAny(254);
    ephemeralKeyMulG.e <== ephemeralKeyBits.out;
    ephemeralKeyMulG.p <== BASE8;
    ephemeralPublicKey === ephemeralKeyMulG.out;

    // Calculate r.P
    component ephemeralKeyMulP = EscalarMulAny(254);
    ephemeralKeyMulP.e <== ephemeralKeyBits.out;
    ephemeralKeyMulP.p <== encryptionPublicKey;

    // Calculate shared secret, h = H(r.P)
    component ephemeralKeyMulPHash = Poseidon(2);
    ephemeralKeyMulPHash.inputs[0] <== ephemeralKeyMulP.out[0];
    ephemeralKeyMulPHash.inputs[1] <== ephemeralKeyMulP.out[1];

    // Assign out = m + h
    out <== m + ephemeralKeyMulPHash.out;
}
