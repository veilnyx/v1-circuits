// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 Gelbfeld AG. Licensed under the GNU General Public License v3.0.
// See /licenses/GPL_LICENSE. Portions derived from GPL-3.0 works; see /LICENSE.

pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/poseidon.circom";
include "./ecc.circom";

template Nullifier() {
    signal input pathIndices; // i
    signal input viewPrivateKey; // v
    signal input commitment;
    signal input revokerPublicKey[2]; // P

    signal output out;

    // Calc v.P (@todo Optimize since we only utilize the x coordinate?)
    component validateRevokerPk = ValidatePoint();
    validateRevokerPk.point <== revokerPublicKey;

    component vkMulP = PointMul();
    vkMulP.scalar <== viewPrivateKey;
    vkMulP.point <== revokerPublicKey;

    // nf = H(i, v.P)
    component hasher = Poseidon(3);
    hasher.inputs[0] <== pathIndices;
    hasher.inputs[1] <== commitment;
    hasher.inputs[2] <== vkMulP.out[0];

    out <== hasher.out;
}