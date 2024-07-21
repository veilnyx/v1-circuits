pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/compconstant.circom";
include "../../node_modules/circomlib/circuits/escalarmulany.circom";
include "./address.circom";

template Register() {
    signal input rootAddress;
    signal input viewPrivateKey;
    signal input viewPublicKey[2];
    signal input signPublicKey[2];

    // Subgroup order (https://eips.ethereum.org/EIPS/eip-2494)
    var SUBGROUP_ORDER = 2736030358979909402780800718157159386076813972158567259200215660948447373041;

    // Base point (G) (https://eips.ethereum.org/EIPS/eip-2494)
    var BASE8[2] = [
        5299619240641551281634865583518297030282874472190772894086521144482721001553,
        16950150798460657717958625567821834550301663161624707787222815936182638968203
    ];

    component vkBits = Num2Bits(254);
    vkBits.in <== viewPrivateKey;

    // Assert viewPrivateKey < SUBGROUP_ORDER
    component comp = CompConstant(SUBGROUP_ORDER);
    comp.in <== vkBits.out;
    comp.out === 0;

    // Caclulate viewPublicKey and constrain it
    component vkMulG = EscalarMulAny(254);
    vkMulG.e <== vkBits.out;
    vkMulG.p <== BASE8;
    viewPublicKey === vkMulG.out;

    component rootAddr = RootAddress();
    rootAddr.signPublicKey <== signPublicKey;
    rootAddr.viewPrivateKey <== viewPrivateKey;
    rootAddr.out === rootAddress;
}