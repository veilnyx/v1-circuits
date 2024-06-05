pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/escalarmulany.circom";

template Nullifier() {
    signal input pathIndices; // i
    signal input viewPrivateKey; // v
    signal input revokerPublicKey[2]; // P

    signal output out;

    // Subgroup order (https://eips.ethereum.org/EIPS/eip-2494)
    var SUBGROUP_ORDER = 2736030358979909402780800718157159386076813972158567259200215660948447373041;

    component vkBits = Num2Bits(254);
    vkBits.in <== viewPrivateKey;

    // Assert v < SUBGROUP_ORDER
    component comp = CompConstant(SUBGROUP_ORDER);
    comp.in <== vkBits.out;
    comp.out === 0;

    // Calc v.P (@todo Optimize since we only utilize the x coordinate?)
    component vkMulP = EscalarMulAny(254);
    vkMulP.e <== vkBits.out;
    vkMulP.p <== revokerPublicKey;

    // nf = H(i, v.P)
    component hasher = Poseidon(2);
    hasher.inputs[0] <== pathIndices;
    hasher.inputs[1] <== vkMulP.out[0];

    out <== hasher.out;
}