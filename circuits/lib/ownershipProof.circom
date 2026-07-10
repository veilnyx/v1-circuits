// SPDX-License-Identifier: LicenseRef-BUSL-1.1
// Copyright (c) 2026 Gelbfeld AG. Licensed under the Business Source License 1.1.
// See /licenses/BUSL_LICENSE. Not for use in a Production Environment.

pragma circom 2.1.5;

include "./schnorr.circom";

template OwnershipProof() {
    signal input hash;
    signal input publicKey[2];
    signal input signature[2];

    component schnorr = SchnorrVerify();
    schnorr.m <== hash;
    schnorr.publicKey <== publicKey;
    schnorr.s <== signature[0];
    schnorr.e <== signature[1];
}
