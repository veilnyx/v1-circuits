// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 Gelbfeld AG. Licensed under the GNU General Public License v3.0.
// See /licenses/GPL_LICENSE. Portions derived from GPL-3.0 works; see /LICENSE.

pragma circom 2.1.6;

template UHF(inputCount) {
    signal input encryptedInputs[inputCount];
    signal input alpha;
    signal input beta;
    signal output gamma;

    signal accumulator[inputCount + 1];
    accumulator[0] <== 0;
    
    signal coeff[inputCount + 1];
    coeff[0] <== 1;

    for(var i = 0; i < inputCount; i++) {
        accumulator[i + 1] <== accumulator[i] + encryptedInputs[i] * coeff[i];
        coeff[i + 1] <== coeff[i] * (alpha + beta);
    }

    gamma <== accumulator[inputCount];
}