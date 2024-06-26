pragma circom 2.1.5;

include "./address.circom";
include "./limitRange.circom";
include "./commitment.circom";
include "./nullifier.circom";
include "./merkleProof.circom";
include "./ownershipProof.circom";
include "./zeroSumFungible.circom";
include "./zeroSumNonFungible.circom";
include "./complianceProof.circom";

template Transact(addrTreeDepth, cmTreeDepth, nIns, nOuts) {
    // Recent merkle roots
    signal input addressTreeRoot;
    signal input commitmentTreeRoot;

    // Shielded transaction hash & sign
    signal input hash;
    signal input signature[2];

    // Registration data
    signal input addressPathIndex;
    signal input addressPathElements[addrTreeDepth];

    // Publicaly auditable data
    signal input pubFlow;
    signal input pubAssetIds[nOuts];
    signal input pubValues[nOuts];

    // Input notes data 
    signal input inViewPrivateKey;
    signal input inSignPublicKey[2]; // WHAT IF THIS IS REVOKER KEYS ITSELF?
    signal input inRevokerPublicKeys[nIns][2];
    signal input inAssetIds[nIns];
    signal input inValues[nIns];
    signal input inBlindings[nIns];
    signal input inNullifiers[nIns];
    signal input inPathIndices[nIns];
    signal input inPathElements[nIns][cmTreeDepth];

    // Output notes data
    signal input outRevokerPublicKey[2];
    signal input outAssetIds[nOuts];
    signal input outAddresses[nOuts];
    signal input outValues[nOuts];
    signal input outBlindings[nOuts];
    signal input outCommitments[nOuts];

    // Stealth addresses for any deposits to shielded account
    signal input refundAddress;
    signal input refundAddressBlinding;

    // Encrypted data
    signal input encryptionPublicKey[2];
    signal input ephemeralKey;
    signal input ephemeralPublicKey[2];
    signal input encryptedInAddress;
    signal input encryptedRefundAddressBlinding;
    signal input encryptedOutAssets[nOuts];
    signal input encryptedOutBlindings[nOuts];
    signal input encryptedOutAddresses[nOuts];

    var MAX_BITS_VALUE = 224;

    // Calculate address
    component inAddress = Address();
    inAddress.signPublicKey <== inSignPublicKey;
    inAddress.viewPrivateKey <== inViewPrivateKey;

    // Check address registered
    component registrationProof = MerkleProof(addrTreeDepth);
    registrationProof.enabled <== 1;
    registrationProof.root <== addressTreeRoot;
    registrationProof.leaf <== inAddress.out;
    registrationProof.pathIndices <== addressPathIndex;
    registrationProof.pathElements <== addressPathElements;

    // Calculate stealth addresses
    component inStealthAddress[nIns];
    for (var i = 0; i < nIns; i++) {
        inStealthAddress[i] = StealthAddress();
        inStealthAddress[i].address <== inAddress.out;
        inStealthAddress[i].revokerPublicKey <== inRevokerPublicKeys[i];
        inStealthAddress[i].blinding <== inBlindings[i];
    }

    // Calculate commitments
    component inCommitmentHasher[nIns];
    for (var i = 0; i < nIns; i++) {
        inCommitmentHasher[i] = Commitment();
        inCommitmentHasher[i].assetId <== inAssetIds[i];
        inCommitmentHasher[i].owner <== inStealthAddress[i].out;
        inCommitmentHasher[i].value <== inValues[i];
    }

    // Calculate nullifiers and assert that they are equal to publicly 
    // announced nullifiers `inNullifiers[i]`
    component inNullifiersHasher[nIns];
    for (var i = 0; i < nIns; i++) {
        inNullifiersHasher[i] = Nullifier();
        inNullifiersHasher[i].pathIndices <== inPathIndices[i];
        inNullifiersHasher[i].commitment <== inCommitmentHasher[i].out;
        inNullifiersHasher[i].viewPrivateKey <== inViewPrivateKey;
        inNullifiersHasher[i].revokerPublicKey <== inRevokerPublicKeys[i];
        inNullifiersHasher[i].out === inNullifiers[i];
    }

    // Check ownership proof
    component inOwnershipProof = OwnershipProof();
    inOwnershipProof.hash <== hash;
    inOwnershipProof.publicKey <== inSignPublicKey;
    inOwnershipProof.signature <== signature;

    // Check merkle inclusions of commitments, except for dummy notes
    // where assetId == 0 AND value == 0
    component inMerkleProof[nIns];
    for (var i = 0; i < nIns; i++) {
        inMerkleProof[i] = MerkleProof(cmTreeDepth);
        //@todo check if this is sufficient
        inMerkleProof[i].enabled <== inAssetIds[i] + inValues[i];
        inMerkleProof[i].root <== commitmentTreeRoot;
        inMerkleProof[i].leaf <== inCommitmentHasher[i].out;
        inMerkleProof[i].pathIndices <== inPathIndices[i];
        inMerkleProof[i].pathElements <== inPathElements[i];
    }

    // Limit output values to be within 224 bits
    component limitRange[nOuts];
    for (var i = 0; i < nOuts; i++) {
        limitRange[i] = LimitRange(MAX_BITS_VALUE);
        limitRange[i].in <== outValues[i];
    }

    component outStealthAddresses[nOuts];
    for (var i = 0; i < nOuts; i++) {
        outStealthAddresses[i] = StealthAddress();
        outStealthAddresses[i].address <== outAddresses[i];
        outStealthAddresses[i].revokerPublicKey <== outRevokerPublicKey;
        outStealthAddresses[i].blinding <== outBlindings[i];
    }

    // Calculate output commitments and assert that they are equal to publicly
    // announced commitments `outCommitments[i]`
    component outCommitmentsHasher[nOuts];
    for (var i = 0; i < nOuts; i++) {
        outCommitmentsHasher[i] = Commitment();
        outCommitmentsHasher[i].assetId <== outAssetIds[i];
        outCommitmentsHasher[i].owner <== outStealthAddresses[i].out;
        outCommitmentsHasher[i].value <== outValues[i];
        outCommitmentsHasher[i].out === outCommitments[i];
    }

    // Assert that total value of each fungible (ERC20) asset in inputs are conserved
    component inZeroSumFungible[nIns];
    for (var i = 0; i < nIns; i++) {
        inZeroSumFungible[i] = ZeroSumFungible(nIns, nOuts);
        inZeroSumFungible[i].pubFlow <== pubFlow;
        inZeroSumFungible[i].assetId <== inAssetIds[i];
        inZeroSumFungible[i].inAssetIds <== inAssetIds;
        inZeroSumFungible[i].inValues <== inValues;
        inZeroSumFungible[i].outAssetIds <== outAssetIds;
        inZeroSumFungible[i].outValues <== outValues;
        inZeroSumFungible[i].pubValues <== pubValues;
        inZeroSumFungible[i].pubAssetIds <== pubAssetIds;
    }

    // Assert that total value of each fungible (ERC20) asset in outputs are conserved
    component outZeroSumFungible[nOuts];
    for (var i = 0; i < nOuts; i++) {
        outZeroSumFungible[i] = ZeroSumFungible(nIns, nOuts);
        outZeroSumFungible[i].pubFlow <== pubFlow;
        outZeroSumFungible[i].assetId <== outAssetIds[i];
        outZeroSumFungible[i].inAssetIds <== inAssetIds;
        outZeroSumFungible[i].inValues <== inValues;
        outZeroSumFungible[i].outAssetIds <== outAssetIds;
        outZeroSumFungible[i].outValues <== outValues;
        outZeroSumFungible[i].pubValues <== pubValues;
        outZeroSumFungible[i].pubAssetIds <== pubAssetIds;
    }

    // Assert that count of each non-fungible (ERC721) asset in inputs are conserved
    component inZeroSumNonFungible[nIns];
    for (var i = 0; i < nIns; i++) {
        inZeroSumNonFungible[i] = ZeroSumNonFungible(nIns, nOuts);
        inZeroSumNonFungible[i].pubFlow <== pubFlow;
        inZeroSumNonFungible[i].assetId <== inAssetIds[i];
        inZeroSumNonFungible[i].nftId <== inValues[i];
        inZeroSumNonFungible[i].inAssetIds <== inAssetIds;
        inZeroSumNonFungible[i].inValues <== inValues;
        inZeroSumNonFungible[i].outAssetIds <== outAssetIds;
        inZeroSumNonFungible[i].outValues <== outValues;
        inZeroSumNonFungible[i].pubValues <== pubValues;
        inZeroSumNonFungible[i].pubAssetIds <== pubAssetIds;
    }

    // Assert that count of each non-fungible (ERC721) asset in outputs are conserved
    component outZeroSumNonFungible[nOuts];
    for (var i = 0; i < nOuts; i++) {
        outZeroSumNonFungible[i] = ZeroSumNonFungible(nIns, nOuts);
        outZeroSumNonFungible[i].pubFlow <== pubFlow;
        outZeroSumNonFungible[i].assetId <== outAssetIds[i];
        outZeroSumNonFungible[i].nftId <== outValues[i];
        outZeroSumNonFungible[i].inAssetIds <== inAssetIds;
        outZeroSumNonFungible[i].inValues <== inValues;
        outZeroSumNonFungible[i].outAssetIds <== outAssetIds;
        outZeroSumNonFungible[i].outValues <== outValues;
        outZeroSumNonFungible[i].pubValues <== pubValues;
        outZeroSumNonFungible[i].pubAssetIds <== pubAssetIds;
    }

    // Refund stealth address check
    component refundAddressCheck = StealthAddressCheck();
    refundAddressCheck.address <== inAddress.out;
    refundAddressCheck.revokerPublicKey <== outRevokerPublicKey;
    refundAddressCheck.blinding <== refundAddressBlinding;
    refundAddressCheck.stealthAddress <== refundAddress;

    // Compliance encryption checks
    component complianceProof = ComplianceProof(nOuts);
    complianceProof.ephemeralKey <== ephemeralKey;
    complianceProof.ephemeralPublicKey <== ephemeralPublicKey;
    complianceProof.encryptionPublicKey <== encryptionPublicKey;

    complianceProof.inAddress <== inAddress.out;
    complianceProof.refundAddress <== refundAddress;
    complianceProof.refundAddressBlinding <== refundAddressBlinding;
    complianceProof.outAssetIds <== outAssetIds;
    for (var i = 0; i < nOuts; i++) {
        complianceProof.outAddresses[i] <== outAddresses[i];
    }
    complianceProof.outValues <== outValues;
    complianceProof.outBlindings <== outBlindings;
    
    complianceProof.encryptedInAddress <== encryptedInAddress;
    complianceProof.encryptedRefundAddressBlinding <== encryptedRefundAddressBlinding;
    complianceProof.encryptedOutAssets <== encryptedOutAssets;
    complianceProof.encryptedOutAddresses <== encryptedOutAddresses;
    complianceProof.encryptedOutBlindings <== encryptedOutBlindings;
}