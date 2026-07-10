// SPDX-License-Identifier: LicenseRef-BUSL-1.1
// Copyright (c) 2026 Gelbfeld AG. Licensed under the Business Source License 1.1.
// See /licenses/BUSL_LICENSE. Not for use in a Production Environment.

pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/bitify.circom";

template EncodeAsset() {
    signal input assetId;
    signal input value;
    signal output out;

    var SIZE_ID = 24; // 3 bytes
    var SIZE_VALUE = 224; // 28 bytes
    var SIZE_ASSET = SIZE_ID + SIZE_VALUE; // 31 bytes

    signal assetBits[SIZE_ASSET];

    component idBits = Num2Bits(SIZE_ID); 
    idBits.in <== assetId;

    component valBits = Num2Bits(SIZE_VALUE);
    valBits.in <== value;

    for (var i = 0; i < SIZE_VALUE; i++) {
        assetBits[i] <== valBits.out[i];
    }

    for (var i = 0; i < SIZE_ID; i++) {
        assetBits[i + SIZE_VALUE] <== idBits.out[i];
    }

    component b2n = Bits2Num(SIZE_ASSET);
    b2n.in <== assetBits;
    out <== b2n.out;
}