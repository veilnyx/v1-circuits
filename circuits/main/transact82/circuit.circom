// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 Gelbfeld AG. Licensed under the GNU General Public License v3.0.
// See /licenses/GPL_LICENSE. Portions derived from GPL-3.0 works; see /LICENSE.

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
]} = Transact(20, 25, 8, 2);                // total: 12