// SPDX-License-Identifier: LicenseRef-BUSL-1.1
// Copyright (c) 2026 Gelbfeld AG. Licensed under the Business Source License 1.1.
// See /licenses/BUSL_LICENSE. Not for use in a Production Environment.

pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/compconstant.circom";
include "../../node_modules/circomlib/circuits/escalarmulany.circom";
include "./address.circom";
include "./ecc.circom";

template Register() {
    signal input rootAddress;
    signal input signPublicKey[2];
    signal input viewPublicKey[2];
    signal input viewPrivateKey;

    // Caclulate viewPublicKey and constrain it
    component vkMulG = PrivateKeyToPublicKey();
    vkMulG.privateKey <== viewPrivateKey;
    vkMulG.out === viewPublicKey;

    component rootAddr = RootAddress();
    rootAddr.signPublicKey <== signPublicKey;
    rootAddr.viewPrivateKey <== viewPrivateKey;
    rootAddr.out === rootAddress;
}