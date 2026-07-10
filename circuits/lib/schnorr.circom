// SPDX-License-Identifier: LicenseRef-BUSL-1.1
// Copyright (c) 2026 Gelbfeld AG. Licensed under the Business Source License 1.1.
// See /licenses/BUSL_LICENSE. Not for use in a Production Environment.

pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/compconstant.circom";
include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";
include "../../node_modules/circomlib/circuits/escalarmulany.circom";
include "./constants.circom";

template SchnorrVerify() { 
    // Message
    signal input m; 

    // Signing key (P)
    signal input publicKey[2];

    // Signature 
    signal input s; 
    signal input e;

    var BASE8[2] = GetBase8Point();
    var SUBGROUP_ORDER = GetSubgroupOrder();

    component sbits = Num2Bits_strict();
    sbits.in <== s;

    component ebits = Num2Bits_strict();
    ebits.in <== e;

    // Assert s < SUBGROUP_ORDER
    component comp = CompConstant(SUBGROUP_ORDER - 1);
    comp.in <== sbits.out;
    comp.out === 0;

    // Calculate s.G
    component sMulG = EscalarMulAny(254);
    sMulG.e <== sbits.out;
    sMulG.p <== BASE8;

    // Calculate e.P
    component eMulP = EscalarMulAny(254);
    eMulP.e <== ebits.out;
    eMulP.p <== publicKey;

    // Calculate s.G + e.P
    component add = BabyAdd();
    add.x1 <== sMulG.out[0];
    add.y1 <== sMulG.out[1];
    add.x2 <== eMulP.out[0];
    add.y2 <== eMulP.out[1];

    // Calculate h = H(s.G + e.P, m)
    component addHash = Poseidon(3);
    addHash.inputs[0] <== add.xout;
    addHash.inputs[1] <== add.yout;
    addHash.inputs[2] <== m;

    // Assert h = e
    e === addHash.out;
}