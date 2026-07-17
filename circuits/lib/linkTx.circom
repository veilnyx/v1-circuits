// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 Gelbfeld AG. Licensed under the GNU General Public License v3.0.
// See /licenses/GPL_LICENSE. Portions derived from GPL-3.0 works; see /LICENSE.

pragma circom 2.1.5;

include "./merkleProof.circom";
include "./commitment.circom";
include "./nullifier.circom";

// Proves that a commitment (created in a prev. tx) is realted to 
// a nullifier (revealed in current tx)
template LinkTx(nLevels, nNotes) {
    signal input root; // association set root

    signal input assetIds[nNotes];
    signal input owners[nNotes];
    signal input values[nNotes];
    signal input blindings[nNotes];
    signal input leafIndices[nNotes];
    signal input pathIndices[nNotes];
    signal input pathElements[nNotes][nLevels];

    signal input nullifiers[nNotes];

    // Check commitments
    component commitmentHasher[nNotes];
    for (var i = 0; i < nNotes; i++) {
        commitmentHasher[i] = Commitment();
        commitmentHasher[i].assetId <== assetIds[i];
        commitmentHasher[i].owner <== owners[i];
        commitmentHasher[i].value <== values[i];
        commitmentHasher[i].out === commitmentHasher[i].out;
    }

    // Check inclusion in tree
    component merkleProof[nNotes];
    for (var i = 0; i < nNotes; i++) {
        merkleProof[i] = MerkleProof(nLevels);
        merkleProof[i].enabled <== assetIds[i] + values[i];
        merkleProof[i].root <== root;
        merkleProof[i].leaf <== commitmentHasher[i].out;
        merkleProof[i].pathIndices <== pathIndices[i];
        merkleProof[i].pathElements <== pathElements[i];
    }

    // Check nullifiers
    component nullifierHasher[nNotes];
    for (var i = 0; i < nNotes; i++) {
        nullifierHasher[i] = Nullifier();
        nullifierHasher[i].pathIndices <== leafIndices[i];
        nullifierHasher[i].commitment <== commitmentHasher[i].out;
        nullifierHasher[i].blinding <== blindings[i];
        nullifierHasher[i].out === nullifiers[i];
    }
}