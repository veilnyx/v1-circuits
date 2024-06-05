pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";
include "./address.circom";

template BeneficiaryCheck() {
    signal input address;
    signal input revokerPublicKey[2];
    signal input blinding;
    signal input beneficiary;

    component xAddress = StealthAddress();
    xAddress.address <== address;
    xAddress.revokerPublicKey <== revokerPublicKey;
    xAddress.blinding <== blinding;

    component checkEq = ForceEqualIfEnabled();
    checkEq.enabled <== beneficiary;
    checkEq.in[0] <== xAddress.out;
    checkEq.in[1] <== beneficiary;
}