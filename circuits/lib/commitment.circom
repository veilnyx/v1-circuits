// SPDX-License-Identifier: LicenseRef-BUSL-1.1
// Copyright (c) 2026 Gelbfeld AG. Licensed under the Business Source License 1.1.
// See /licenses/BUSL_LICENSE. Not for use in a Production Environment.

pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/poseidon.circom";

template Commitment() {
    signal input assetId;
    signal input owner;
    signal input value;
    signal output out;

    component hasher = Poseidon(3);
    hasher.inputs[0] <== assetId;
    hasher.inputs[1] <== owner;
    hasher.inputs[2] <== value;

    out <== hasher.out;
}