// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 Gelbfeld AG. Licensed under the GNU General Public License v3.0.
// See /licenses/GPL_LICENSE. Portions derived from GPL-3.0 works; see /LICENSE.

pragma circom 2.1.6;

include "../../node_modules/circomlib/circuits/sha256/sha256.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";

// out = uint256(sha256(abi.encodePacked(uint256 in[0], ..., uint256 in[n-1]))) mod p
//
// Matches Solidity `uint256(sha256(abi.encodePacked(words))) % FIELD_SIZE`. Each input
// must be a canonical field element: Num2Bits_strict rejects values >= p, so a value and
// its alias value + p cannot both hash. Bits2Num over the 256 digest bits reduces mod p,
// which is exactly the contract's `% FIELD_SIZE`.
template Sha256Fields(n) {
    signal input in[n];
    signal output out;

    component bits[n];
    component hasher = Sha256(256 * n);
    for (var k = 0; k < n; k++) {
        bits[k] = Num2Bits_strict();
        bits[k].in <== in[k];
        // 32-byte big-endian word: 2 zero bits, then the 254 value bits MSB first
        hasher.in[256 * k] <== 0;
        hasher.in[256 * k + 1] <== 0;
        for (var i = 0; i < 254; i++) {
            hasher.in[256 * k + 2 + i] <== bits[k].out[253 - i];
        }
    }

    component digest = Bits2Num(256);
    for (var i = 0; i < 256; i++) {
        digest.in[i] <== hasher.out[255 - i];
    }
    out <== digest.out;
}
