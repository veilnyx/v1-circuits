// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 Gelbfeld AG. Licensed under the GNU General Public License v3.0.
// See /licenses/GPL_LICENSE. Portions derived from GPL-3.0 works; see /LICENSE.

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
