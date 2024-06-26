pragma circom 2.1.5;

include "../../lib/transact.circom";

component main { public [ 
    addressTreeRoot,                // len: 1
    commitmentTreeRoot,             // len: 1
    hash,                           // len: 1
    pubFlow,                        // len: 1
    pubAssetIds,                    // len: nOuts
    pubValues,                      // len: nOuts
    inNullifiers,                   // len: nIns
    outRevokerPublicKey,            // len: 2
    outCommitments,                 // len: nOuts
    refundAddress,                  // len: 1
    encryptionPublicKey,            // len: 2
    ephemeralPublicKey,             // len: 2
    encryptedInAddress,             // len: 1
    encryptedRefundAddressBlinding, // len: 1
    encryptedOutAssets,             // len: nOuts
    encryptedOutBlindings,          // len: nOuts
    encryptedOutAddresses           // len: nOuts
]} = Transact(20, 25, 2, 2);        // total: 13 + nIns + 6 * nOuts