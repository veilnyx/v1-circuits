pragma circom 2.1.5;

include "./zeroSum.circom";
include "./address.circom";
include "./limitRange.circom";
include "./commitment.circom";
include "./nullifier.circom";
include "./merkleProof.circom";
include "./ownershipProof.circom";

// =============== Account ===============
// Private key = s
// Public key, P = s * G = (P.x, P.y)
// Address, a = H(P.x, P.y)

// =============== Asset =================
// Asset identifier = j
// Asset value = v

// =============== Note ==================
// Note, n = { j, v, a }
// Commitment, h_N = H(j, v, a, r)  where, r = random salt
// Nullifier, h_f = H(i, sign) where, i = index, sign = schnorr signature

//@todo hide private-able assetIds
//@todo add nft support

template Transact(nLevels, nIns, nOuts) {
    signal input root;
    signal input assetId;
    
    signal input inPublicValue;
    signal input inPublicKey[nIns][2]; 
    signal input inSignature[nIns][2];
    signal input inValue[nIns];
    signal input inNullifier[nIns];
    signal input inPathIndices[nIns];
    signal input inPathElements[nIns][nLevels];

    signal input outPublicValue;
    signal input outOwner[nOuts];
    signal input outValue[nOuts];
    signal input outCommitment[nOuts];

    component inOwner[nIns];
    for(var i = 0; i < nIns; i++) {
        inOwner[i] = Address();
        inOwner[i].publicKey <== inPublicKey[i];
    }

    component inCommitmentHasher[nIns];
    for(var i = 0; i < nIns; i++) {
        inCommitmentHasher[i] = Commitment();
        inCommitmentHasher[i].owner <== inOwner[i].out;
        inCommitmentHasher[i].assetId <== assetId;
        inCommitmentHasher[i].value <== inValue[i];
    }

    component inNullifierHasher[nIns];
    for(var i = 0; i < nIns; i++) {
        inNullifierHasher[i] = Nullifier();
        inNullifierHasher[i].pathIndices <== inPathIndices[i];
        inNullifierHasher[i].signature <== inSignature[i];
        inNullifierHasher[i].out === inNullifier[i];
    }

    component inOwnershipProof[nIns];
    for(var i = 0; i < nIns; i++) {
        inOwnershipProof[i] = OwnershipProof();
        inOwnershipProof[i].publicKey <== inPublicKey[i];
        inOwnershipProof[i].commitment <== inCommitmentHasher[i].out;
        inOwnershipProof[i].signature <== inSignature[i];
    }

    component inMerkleProof[nIns];
    for(var i = 0; i < nIns; i++) {
        inMerkleProof[i] = MerkleProof(nLevels);
        inMerkleProof[i].root <== root;
        inMerkleProof[i].leaf <== inCommitmentHasher[i].out;
        inMerkleProof[i].pathIndices <== inPathIndices[i];
        inMerkleProof[i].pathElements <== inPathElements[i];
    }

    component limitRange[nOuts];
    for(var i = 0; i < nOuts; i++) { 
        limitRange[i] = LimitRange(248);
        limitRange[i].in <== outValue[i];
    }

    component outCommitmentHasher[nOuts];
    for(var i = 0; i < nOuts; i++) {
        outCommitmentHasher[i] = Commitment();
        outCommitmentHasher[i].owner <== outOwner[i];
        outCommitmentHasher[i].assetId <== assetId;
        outCommitmentHasher[i].value <== outValue[i];
        outCommitmentHasher[i].out === outCommitment[i];
    }

    component zeroSum = ZeroSum(nIns, nOuts);
    zeroSum.inValue <== inValue;
    zeroSum.inPublicValue <== inPublicValue;
    zeroSum.outValue <== outValue;
    zeroSum.outPublicValue <== outPublicValue;
}