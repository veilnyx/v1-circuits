// SPDX-License-Identifier: LicenseRef-BUSL-1.1
// Copyright (c) 2026 Gelbfeld AG. Licensed under the Business Source License 1.1.
// See /licenses/BUSL_LICENSE. Not for use in a Production Environment.

pragma circom 2.1.6;

include "../../lib/transact.circom";

component main { public [ 
    addressTreeRoot,                        // len: 1
    commitmentTreeRoot,                     // len: 1
    hash,                                   // len: 1
    pubFlow,                                // len: 1
    outRevokerPublicKey,                    // len: 2
    refundAddress,                          // len: 1
    keySeedEncryptionPublicKey,             // len: 2
    alpha,                                  // len: 1
    beta,                                   // len: 1
    gamma                                   // len: 1
]} = Transact(20, 25, 2, 1);                // total PI: 11 