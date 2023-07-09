pragma circom 2.0.0;

include "./transact.circom";

template MultiTransact(nLevels, nA, nIns, nOuts) {
    signal input root;
    signal input assetId[nA];

    signal input inPublicValue[nA];
    signal input inPublicKey[nA][nIns][2];
    signal input inSignature[nA][nIns][2];
    signal input inValue[nA][nIns];
    signal input inSalt[nA][nIns];
    signal input inNullifier[nA][nIns];
    signal input inPathIndices[nA][nIns];
    signal input inPathElements[nA][nIns][nLevels];

    signal input outPublicValue[nA];
    signal input outOwner[nA][nOuts];
    signal input outValue[nA][nOuts];
    signal input outSalt[nA][nOuts];
    signal input outCommitment[nA][nOuts];

    signal input dataHash;

    component transact[nA];
    for (var i = 0; i < nA; i++) {
        transact[i] = Transact(nLevels, nIns, nOuts);
        transact[i].root <== root;
        transact[i].assetId <== assetId[i];
        transact[i].inPublicValue <== inPublicValue[i];
        transact[i].inPublicKey <== inPublicKey[i];
        transact[i].inSignature <== inSignature[i];
        transact[i].inValue <== inValue[i];
        transact[i].inSalt <== inSalt[i];
        transact[i].inNullifier <== inNullifier[i];
        transact[i].inPathIndices <== inPathIndices[i];
        transact[i].inPathElements <== inPathElements[i];

        transact[i].outPublicValue <== outPublicValue[i];
        transact[i].outOwner <== outOwner[i];
        transact[i].outValue <== outValue[i];
        transact[i].outSalt <== outSalt[i];
        transact[i].outCommitment <== outCommitment[i];
    }

    signal dataHashSquare <== dataHash * dataHash;
}