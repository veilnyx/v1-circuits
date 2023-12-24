pragma circom 2.1.5;

include "./zeroSum.circom";
include "./stealthAddress.circom";
include "./limitRange.circom";
include "./commitment.circom";
include "./nullifier.circom";
include "./merkleProof.circom";
include "./ownershipProof.circom";

template Transact(nLevels, nIns, nOuts) {
    signal input root;
    signal input publicFlow;

    signal input inPublicKeys[nIns][2];
    signal input inSignatures[nIns][2];
    signal input inAssetIds[nIns];
    signal input inValues[nIns];
    signal input inBlindings[nIns];
    signal input inNullifiers[nIns];
    signal input inPathIndices[nIns];
    signal input inPathElements[nIns][nLevels];

    signal input outAssetIds[nIns];
    signal input outOwners[nOuts];
    signal input outValues[nOuts];
    signal input outCommitments[nOuts];

    signal input publicAssetIds[nOuts];
    signal input publicValues[nOuts];

    // If asset `publicAssetIds[i]` is publicly announced (i.e. is non-zero)
    // then assert `outAssetIds[i]` to be equal to `publicAssetIds[i]`
    component forceSameAssetIds[nOuts];
    for (var i = 0; i < nOuts; i++) {
        forceSameAssetIds[i] = ForceEqualIfEnabled();
        forceSameAssetIds[i].enabled <== publicAssetIds[i];
        forceSameAssetIds[i].in[0] <== outAssetIds[i];
        forceSameAssetIds[i].in[1] <== publicAssetIds[i];
    }

    // Calculate stealth addresses
    component inOwner[nIns];
    for (var i = 0; i < nIns; i++) {
        inOwner[i] = StealthAddress();
        inOwner[i].publicKey <== inPublicKeys[i];
        inOwner[i].blinding <== inBlindings[i];
    }

    // Calculate commitments
    component inCommitmentHasher[nIns];
    for (var i = 0; i < nIns; i++) {
        inCommitmentHasher[i] = Commitment();
        inCommitmentHasher[i].assetId <== inAssetIds[i];
        inCommitmentHasher[i].owner <== inOwner[i].out;
        inCommitmentHasher[i].value <== inValues[i];
    }

    // Calculate nullifiers and assert that they are equal to publicly 
    // announced nullifiers `inNullifiers[i]`
    component inNullifiersHasher[nIns];
    for (var i = 0; i < nIns; i++) {
        inNullifiersHasher[i] = Nullifier();
        inNullifiersHasher[i].pathIndices <== inPathIndices[i];
        inNullifiersHasher[i].commitment <== inCommitmentHasher[i].out;
        inNullifiersHasher[i].blinding <== inBlindings[i];
        inNullifiersHasher[i].out === inNullifiers[i];
    }

    // Calculate ownership proofs
    component inOwnershipProof[nIns];
    for (var i = 0; i < nIns; i++) {
        inOwnershipProof[i] = OwnershipProof();
        inOwnershipProof[i].publicKey <== inPublicKeys[i];
        inOwnershipProof[i].commitment <== inCommitmentHasher[i].out;
        inOwnershipProof[i].signature <== inSignatures[i];
    }

    // Check merkle inclusions of commitments, except for dummy notes
    // where assetId == 0 and value == 0
    component inMerkleProof[nIns];
    for (var i = 0; i < nIns; i++) {
        inMerkleProof[i] = MerkleProof(nLevels);
        inMerkleProof[i].enabled <== inAssetIds[i] + inValues[i];
        inMerkleProof[i].root <== root;
        inMerkleProof[i].leaf <== inCommitmentHasher[i].out;
        inMerkleProof[i].pathIndices <== inPathIndices[i];
        inMerkleProof[i].pathElements <== inPathElements[i];
    }

    // Limit output values to be within 248 bits
    component limitRange[nOuts];
    for (var i = 0; i < nOuts; i++) { 
        limitRange[i] = LimitRange(248);
        limitRange[i].in <== outValues[i];
    }

    // Calculate output commitments and assert that they are equal to publicly
    // announced commitments `outCommitments[i]`
    component outCommitmentsHasher[nOuts];
    for (var i = 0; i < nOuts; i++) {
        outCommitmentsHasher[i] = Commitment();
        outCommitmentsHasher[i].assetId <== outAssetIds[i];
        outCommitmentsHasher[i].owner <== outOwners[i];
        outCommitmentsHasher[i].value <== outValues[i];
        outCommitmentsHasher[i].out === outCommitments[i];
    }

    // Assert that total value of each fungible (ERC20) asset in inputs are conserved
    component inZeroSumFungible[nIns];
    for (var i = 0; i < nIns; i++) {
        inZeroSumFungible[i] = ZeroSumFungible(nIns, nOuts);
        inZeroSumFungible[i].assetId <== inAssetIds[i];
        inZeroSumFungible[i].inAssetIds <== inAssetIds;
        inZeroSumFungible[i].inValues <== inValues;
        inZeroSumFungible[i].outAssetIds <== outAssetIds;
        inZeroSumFungible[i].outValues <== outValues;
        inZeroSumFungible[i].publicValues <== publicValues;
    }

    // Assert that total value of each fungible (ERC20) asset in outputs are conserved
    component outZeroSumFungible[nOuts];
    for (var i = 0; i < nOuts; i++) {
        outZeroSumFungible[i] = ZeroSumFungible(nIns, nOuts);
        outZeroSumFungible[i].assetId <== outAssetIds[i];
        outZeroSumFungible[i].inAssetIds <== inAssetIds;
        outZeroSumFungible[i].inValues <== inValues;
        outZeroSumFungible[i].outAssetIds <== outAssetIds;
        outZeroSumFungible[i].outValues <== outValues;
        outZeroSumFungible[i].publicValues <== publicValues;
    }

    // Assert that count of each non-fungible (ERC721) asset in inputs are conserved
    component inZeroSumNonFungible[nIns];
    for (var i = 0; i < nIns; i++) {
        inZeroSumNonFungible[i] = ZeroSumNonFungible(nIns, nOuts);
        inZeroSumNonFungible[i].assetId <== inAssetIds[i];
        inZeroSumNonFungible[i].nftId <== inValuess[i];
        inZeroSumNonFungible[i].inAssetIds <== inAssetIds;
        inZeroSumNonFungible[i].inValues <== inValues;
        inZeroSumNonFungible[i].outAssetIds <== outAssetIds;
        inZeroSumNonFungible[i].outValues <== outValues;
        inZeroSumNonFungible[i].publicValues <== publicValues;
    }

    // Assert that count of each non-fungible (ERC721) asset in outputs are conserved
    component outZeroSumNonFungible[nOuts];
    for (var i = 0; i < nOuts; i++) {
        outZeroSumNonFungible[i] = ZeroSumNonFungible(nIns, nOuts);
        outZeroSumNonFungible[i].assetId <== outAssetIds[i];
        outZeroSumNonFungible[i].nftId <== outValues[i];
        outZeroSumNonFungible[i].inAssetIds <== inAssetIds;
        outZeroSumNonFungible[i].inValues <== inValues;
        outZeroSumNonFungible[i].outAssetIds <== outAssetIds;
        outZeroSumNonFungible[i].outValues <== outValues;
        outZeroSumNonFungible[i].publicValues <== publicValues;
    }
}