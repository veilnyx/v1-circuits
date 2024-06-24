pragma circom 2.1.5;

include "../../lib/transact.circom";

component main { public [ 
    addressTreeRoot,          // len: 1
    commitmentTreeRoot,       // len: 1
    hash,                     // len: 1
    pubFlow,                  // len: 1
    pubAssetIds,              // len: nOuts
    pubValues,                // len: nOuts
    inNullifiers,             // len: nIns
    outRevokerPublicKey,      // len: 2
    outCommitments,           // len: nOuts
    beneficiary,              // len: 1
    encPubKey,                // len: 2
    ephPubKey,                // len: 2
    encInAddress,             // len: 1
    encBeneficiaryBlinding,   // len: 1
    encOutAssets,             // len: nOuts
    encOutBlindings,          // len: nOuts
    encOutAddresses           // len: nOuts
]} = Transact(20, 25, 2, 2);    // total: 13 + nIns + 6 * nOuts