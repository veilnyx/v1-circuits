// SPDX-License-Identifier: LicenseRef-BUSL-1.1
// Copyright (c) 2026 Gelbfeld AG. Licensed under the Business Source License 1.1.
// See /licenses/BUSL_LICENSE. Not for use in a Production Environment.

pragma circom 2.1.6;

include "../../node_modules/circomlib/circuits/bitify.circom";

template CastToBits(nOut) {
    signal input in;
    signal output out;

    assert(nOut < 254);

    component nToB = Num2Bits_strict();
    nToB.in <== in;

    component bToN = Bits2Num(nOut);
    for (var i = 0; i < nOut; i++) {
        bToN.in[i] <== nToB.out[i];
    }

    out <== bToN.out;
}

template LimitRange(maxBits) {
    signal input in;

    assert(maxBits < 254);
    
    component bitifier = Num2Bits(maxBits);
    bitifier.in <== in;
}

template Sum(n) {
    signal input in[n];
    signal output out;

    signal accumulator[n + 1];
    accumulator[0] <== 0;
    
    for (var i = 0; i < n; i++) {
        accumulator[i + 1] <== accumulator[i] + in[i];
    }

    out <== accumulator[n];
}