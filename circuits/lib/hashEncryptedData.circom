// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 Gelbfeld AG. Licensed under the GNU General Public License v3.0.
// See /licenses/GPL_LICENSE. Portions derived from GPL-3.0 works; see /LICENSE.

pragma circom 2.1.5;
include "../../node_modules/circomlib/circuits/poseidon.circom";

// Sequential hashing. Hashing each encrypted data of the private inputs set seperately and combining all hashes together to produce the `encryptedDatahash`. 

template HashEncryptedData(nOuts) {
    // Input signals
    signal input encryptedDataEncryptionKeySeed[3];
    signal input encryptedRefundData[4];
    signal input encryptedNoteData[nOuts][4];
    signal output out;

    // 1. Hash encryptedDataEncryptionKeySeed (3 elements)
    component keySeedHasher = Poseidon(3);
    for (var i = 0; i < 3; i++) {
        keySeedHasher.inputs[i] <== encryptedDataEncryptionKeySeed[i];
    }
    var keySeedHash = keySeedHasher.out;

    // 2. Hash encryptedRefundData (4 elements)
    component refundDataHasher = Poseidon(4);
    for (var i = 0; i < 4; i++) {
        refundDataHasher.inputs[i] <== encryptedRefundData[i];
    }
    var refundHash = refundDataHasher.out;

    // 3. Hash each encryptedNote separately and combine
    component noteHashers[nOuts];
    signal noteHashes[nOuts];
    
    for (var i = 0; i < nOuts; i++) {
        noteHashers[i] = Poseidon(4);
        for (var j = 0; j < 4; j++) {
            noteHashers[i].inputs[j] <== encryptedNoteData[i][j];
        }
        noteHashes[i] <== noteHashers[i].out;
    }

    // 4. Final hash combining all hashes
    component finalHasher = Poseidon(2 + nOuts);
    finalHasher.inputs[0] <== keySeedHash;
    finalHasher.inputs[1] <== refundHash;
    for (var i = 0; i < nOuts; i++) {
        finalHasher.inputs[2 + i] <== noteHashes[i];
    }

    out <== finalHasher.out;
}