// SPDX-License-Identifier: LicenseRef-BUSL-1.1
// Copyright (c) 2026 Gelbfeld AG. Licensed under the Business Source License 1.1.
// See /licenses/BUSL_LICENSE. Not for use in a Production Environment.

pragma circom 2.1.6;

include "../../node_modules/circomlib/circuits/escalarmulany.circom";
include "../../node_modules/circomlib/circuits/compconstant.circom";
include "./constants.circom";

template PointMul() {
    signal input scalar;
    signal input point[2];
    signal output out[2];

    var SUBGROUP_ORDER = GetSubgroupOrder();

    component scalarBits = Num2Bits_strict();
    scalarBits.in <== scalar;

    // Assert scaler < SUBGROUP_ORDER
    component comp = CompConstant(SUBGROUP_ORDER - 1);
    comp.in <== scalarBits.out;
    comp.out === 0;

    component mul = EscalarMulAny(254);
    mul.e <== scalarBits.out;
    mul.p <== point;

    out <== mul.out;
}

template PrivateKeyToPublicKey() {
    signal input privateKey;
    signal output out[2];

    var BASE8[2] = GetBase8Point();

    component mul = PointMul();
    mul.scalar <== privateKey;
    mul.point <== BASE8;

    out <== mul.out;
}
