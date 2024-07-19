pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/poseidon.circom";
include "./address.circom";
include "./merkleProof.circom";
include "./commitment.circom";
include "./nullifier.circom";

template AnonymityScore(cmTreeDepth, n) {
    signal input commitmentTreeRoot;
    signal input assetId;
    signal input viewPrivateKey;
    signal input signPublicKey[2];
    signal input revokerPublicKeys[n][2];
    signal input values[n];
    signal input blindings[n];
    signal input leafIndices[n];
    signal input pathElements[n][cmTreeDepth];
    signal input nullifiers[n];
    signal input nullifyLeafIndices[n];
    signal input anonymityScore;

    // Calculate address
    component rootAddr = RootAddress();
    rootAddr.signPublicKey <== signPublicKey;
    rootAddr.viewPrivateKey <== viewPrivateKey;

    // Calculate blinded addresses
    component blindedAddresses[n];
    for (var i = 0; i < n; i++) {
        blindedAddresses[i] = BlindedAddress();
        blindedAddresses[i].rootAddress <== rootAddr.out;
        blindedAddresses[i].revokerPublicKey <== revokerPublicKeys[i];
        blindedAddresses[i].blinding <== blindings[i];
    }

    component commitmentHashers[n];
    for (var i = 0; i < n; i++) {
        commitmentHashers[i] = Commitment();
        commitmentHashers[i].assetId <== assetId;
        commitmentHashers[i].owner <== blindedAddresses[i].out;
        commitmentHashers[i].value <== values[i];
    }

    // Calculate nullifiers and assert that they are equal to publicly 
    // announced nullifiers `nullifiers[i]`
    component nullifierHashers[n];
    for (var i = 0; i < n; i++) {
        nullifierHashers[i] = Nullifier();
        nullifierHashers[i].pathIndices <== leafIndices[i];
        nullifierHashers[i].commitment <== commitmentHashers[i].out;
        nullifierHashers[i].viewPrivateKey <== viewPrivateKey;
        nullifierHashers[i].revokerPublicKey <== revokerPublicKeys[i];
        nullifierHashers[i].out === nullifiers[i];
    }

    // Check merkle inclusions of commitments, except for dummy notes
    // where assetId == 0 AND value == 0
    component merkleProofs[n];
    for (var i = 0; i < n; i++) {
        merkleProofs[i] = MerkleProof(cmTreeDepth);
        //@todo check if this is sufficient
        merkleProofs[i].enabled <== assetId + values[i];
        merkleProofs[i].root <== commitmentTreeRoot;
        merkleProofs[i].leaf <== commitmentHashers[i].out;
        merkleProofs[i].pathIndices <== leafIndices[i];
        merkleProofs[i].pathElements <== pathElements[i];
    }

    signal scores[n + 1];
    scores[0] <== 0;
    for (var i = 0; i < n; i++) {
        scores[i + 1] <== scores[i] + values[i] * (nullifyLeafIndices[i] - leafIndices[i]);
    }

    anonymityScore === scores[n];
}