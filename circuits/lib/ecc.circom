// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 Gelbfeld AG. Licensed under the GNU General Public License v3.0.
// See /licenses/GPL_LICENSE. Portions derived from GPL-3.0 works; see /LICENSE.

pragma circom 2.1.6;

include "../../node_modules/circomlib/circuits/escalarmulany.circom";
include "../../node_modules/circomlib/circuits/compconstant.circom";
include "../../node_modules/circomlib/circuits/babyjub.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";
include "./constants.circom";

/**
 * Validates a point supplied from outside the circuit before it is used as the
 * base of a scalar multiplication.
 *
 * circomlib's EscalarMulAny states as a precondition that "p is in the subgroup
 * and it is different to 0", and enforces neither. Worse, it special-cases
 * p[0] == 0 and forces the output to the identity FOR ANY SCALAR, so an
 * unvalidated (0, y) makes a scalar multiplication return a constant.
 *
 * Two checks:
 *  1. On-curve, via BabyCheck: a*x^2 + y^2 === 1 + d*x^2*y^2.
 *  2. Not of low order: the cofactor is 8, so a point whose order divides 8
 *     satisfies 8P = O. Three doublings and an assertion that the result is not
 *     the identity (0, 1) rejects all eight low-order points, including the
 *     identity itself and the order-2 point (0, -1) that trigger the
 *     EscalarMulAny special case.
 *
 * Residual: this rejects points of order dividing 8, not every point outside
 * the prime-order subgroup. A mixed-order point (order 2L, 4L or 8L) still
 * passes and leaks the scalar modulo its small component. Fully excluding those
 * needs L*P === O, a variable-base multiplication by a 251-bit constant, which
 * would cost roughly as much as the multiplication being protected and is
 * multiplied by every point entry (eleven of them in transact84). The cheap
 * check removes the collapse-to-constant behaviour that is actually reachable
 * here; the expensive one is worth revisiting if a point ever becomes
 * attacker-chosen without also being committed elsewhere.
 */
template ValidatePoint() {
    signal input point[2];

    component onCurve = BabyCheck();
    onCurve.x <== point[0];
    onCurve.y <== point[1];

    component dbl1 = BabyDbl();
    dbl1.x <== point[0];
    dbl1.y <== point[1];

    component dbl2 = BabyDbl();
    dbl2.x <== dbl1.xout;
    dbl2.y <== dbl1.yout;

    component dbl3 = BabyDbl();
    dbl3.x <== dbl2.xout;
    dbl3.y <== dbl2.yout;

    // 8P == O only for points of order dividing 8. O is (0, 1), and x == 0
    // identifies it uniquely among on-curve points.
    component isIdentity = IsZero();
    isIdentity.in <== dbl3.xout;
    isIdentity.out === 0;
}

template PointMul() {
    signal input scalar;
    signal input point[2];
    signal output out[2];

    var SUBGROUP_ORDER = GetSubgroupOrder();

    component scalarBits = Num2Bits_strict();
    scalarBits.in <== scalar;

    // Assert scaler < SUBGROUP_ORDER
    component comp = CompConstant(SUBGROUP_ORDER - 1);
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

    var BASE8[2] = GetBase8Point();

    component mul = PointMul();
    mul.scalar <== privateKey;
    mul.point <== BASE8;

    out <== mul.out;
}
