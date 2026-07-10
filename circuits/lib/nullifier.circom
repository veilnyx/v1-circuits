// SPDX-License-Identifier: LicenseRef-BUSL-1.1
// Copyright (c) 2026 Gelbfeld AG. Licensed under the Business Source License 1.1.
// See /licenses/BUSL_LICENSE. Not for use in a Production Environment.

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