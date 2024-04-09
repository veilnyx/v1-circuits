pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";
include "./stealthAddress.circom";

template BeneficiaryCheck() {
    signal input publicKey[2];
    signal input beneficiary;
    signal input blinding;

    component xAddress = StealthAddress();
    xAddress.publicKey <== publicKey;
    xAddress.blinding <== blinding;

    component checkEq = ForceEqualIfEnabled();
    checkEq.enabled <== beneficiary;
    checkEq.in[0] <== xAddress.out;
    checkEq.in[1] <== beneficiary;
}