pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/compconstant.circom";
include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";
include "../../node_modules/circomlib/circuits/escalarmulany.circom";
include "../../node_modules/circomlib/circuits/escalarmulfix.circom";

//This circom code is used to constrain the schnorr signature.
// Based off of the wikipedia article: https://en.wikipedia.org/wiki/Schnorr_signature
// Inspired by Circom's EdDSA Poseidon: https://github.com/iden3/circomlib/blob/master/circuits/eddsaposeidon.circom
template SchnorrPoseidon(){ 
    signal input enabled; 
    signal input M; //message
    //y = (Ax, Ay) = g^x is a point
    signal input Ax;
    signal input Ay; 
    signal input S; //S = k - xe is apart of our signature
    signal input e; //e is apart of our signature

    //need to ensure that S is in our subgroup (from eddsa code)
    component snum2bits = Num2Bits(253);
    snum2bits.in <== S;
    component compConstant = CompConstant(2736030358979909402780800718157159386076813972158567259200215660948447373041);
    for (var i=0; i<253; i++) {
        snum2bits.out[i] ==> compConstant.in[i];
    }
    compConstant.in[253] <== 0;
    compConstant.out*enabled === 0;

    //calculate g^s
    var BASE8[2] = [
        5299619240641551281634865583518297030282874472190772894086521144482721001553,
        16950150798460657717958625567821834550301663161624707787222815936182638968203
    ];
    component mulAny = EscalarMulAny(253);
    for(var i = 0; i<253; i++){
        mulAny.e[i] <== snum2bits.out[i];
    }
    mulAny.p[0] <== BASE8[0];
    mulAny.p[1] <== BASE8[1];

    //calculate y^e
    component enum2bits = Num2Bits(254);
    enum2bits.in <== e;

    component mulAny1 = EscalarMulAny(254);
    for(var i = 0; i<254; i++){
        mulAny1.e[i] <== enum2bits.out[i];
    }
    mulAny1.p[0] <== Ax;
    mulAny1.p[1] <== Ay;

    //rv = g^sy^e (which is just adding g^s and y^e)
    component add1 = BabyAdd();
    add1.x1 <== mulAny.out[0];
    add1.y1 <== mulAny.out[1];
    add1.x2 <== mulAny1.out[0];
    add1.y2 <== mulAny1.out[1];

    //hash H(rv || M)
    component ev = Poseidon(3);
    ev.inputs[0] <== add1.xout;
    ev.inputs[1] <== add1.yout;
    ev.inputs[2] <== M;


    //check if e == ev
    component eqCheck = ForceEqualIfEnabled();
    eqCheck.enabled <== enabled;
    eqCheck.in[0] <== e;
    eqCheck.in[1] <== ev.out;
}