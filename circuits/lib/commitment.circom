// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 Gelbfeld AG. Licensed under the GNU General Public License v3.0.
// See /licenses/GPL_LICENSE. Portions derived from GPL-3.0 works; see /LICENSE.

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