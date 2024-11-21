pragma circom 2.1.6;

include "../../node_modules/circomlib/circuits/escalarmulany.circom";
include "../../node_modules/circomlib/circuits/compconstant.circom";

template PointMul() {
    signal input scalar;
    signal input point[2];
    signal output out[2];

    // Subgroup order (https://eips.ethereum.org/EIPS/eip-2494)
    var SUBGROUP_ORDER = 2736030358979909402780800718157159386076813972158567259200215660948447373041;

    component scalarBits = Num2Bits(254);
    scalarBits.in <== scalar;

    // Assert scaler < SUBGROUP_ORDER
    component comp = CompConstant(SUBGROUP_ORDER);
    comp.in <== scalarBits.out;
    comp.out === 0;

    component mul = EscalarMulAny(254);
    mul.e <== scalarBits.out;
    mul.p <== point;

    out <== mul.out;
}

template PrivateKeyToPublicKey() {
    signal input privateKey;
    signal output out[2];

    // Base point (G) (https://eips.ethereum.org/EIPS/eip-2494)
    var BASE8[2] = [
        5299619240641551281634865583518297030282874472190772894086521144482721001553,
        16950150798460657717958625567821834550301663161624707787222815936182638968203
    ];

    component mul = PointMul();
    mul.scalar <== privateKey;
    mul.point <== BASE8;

    out <== mul.out;
}
