// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 Gelbfeld AG. Licensed under the GNU General Public License v3.0.
// See /licenses/GPL_LICENSE. Portions derived from GPL-3.0 works; see /LICENSE.

pragma circom 2.1.5;

include "../../lib/anonymityScore.circom";

component main { public [ 
    commitmentTreeRoot,       // len: 1
    assetId,                  // len: 1
    nullifiers,               // len: n
    nullifyLeafIndices,       // len: n
    anonymityScore            // len: 1
]} = AnonymityScore(25, 8);   // total: 2*n + 3