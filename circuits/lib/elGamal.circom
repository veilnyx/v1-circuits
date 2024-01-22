pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/bitify.circom";
include "../../node_modules/circomlib/circuits/babyjub.circom";
include "../../node_modules/circomlib/circuits/compconstant.circom";
include "../../node_modules/circomlib/circuits/escalarmulany.circom";
include "../../node_modules/circomlib/circuits/pointbits.circom";
include "../../node_modules/circomlib/circuits/poseidon.circom";

template ElGamalPoseidonEncrypt() {
    // Randomnesss
    signal input r;

    // Message
    signal input m;

    // Encryption key (P)
    signal input publicKey[2];

    // Ciphertext
    signal input c1Packed;
    signal input c2;

    // c1 = c1Packed.unpack()
    signal c1[2];

    // Base point (G) (https://eips.ethereum.org/EIPS/eip-2494)
    var BASE8[2] = [
        5299619240641551281634865583518297030282874472190772894086521144482721001553,
        16950150798460657717958625567821834550301663161624707787222815936182638968203
    ];

    // Subgroup order (https://eips.ethereum.org/EIPS/eip-2494)
    var SUBGROUP_ORDER = 2736030358979909402780800718157159386076813972158567259200215660948447373041;

    component rbits = Num2Bits(254);
    rbits.in <== r;

    // Assert r < SUBGROUP_ORDER
    component comp = CompConstant(SUBGROUP_ORDER);
    comp.in <== rbits.out;
    comp.out === 0;

    // Caclulate c1 = r.G
    component rMulG = EscalarMulAny(254);
    rMulG.e <== rbits.out;
    rMulG.p <== BASE8;
    c1 <== rMulG.out;

    // Assert c1Packed = c1.pack()
    component p2b = Point2Bits_Strict();
    component b2n = Bits2Num(256);
    p2b.in <== c1;
    b2n.in <== p2b.out;
    c1Packed === b2n.out;

    // Calculate r.P
    component rMulP = EscalarMulAny(254);
    rMulP.e <== rbits.out;
    rMulP.p <== publicKey;

    // Calculate h = H(r.P)
    component rMulPHash = Poseidon(2);
    rMulPHash.inputs[0] <== rMulP.out[0];
    rMulPHash.inputs[1] <== rMulP.out[1];

    // Assert c2 = m + h
    c2 === m + rMulPHash.out;
}
