import { poseidon, babyJub } from 'xcircomlib';
import { Scalar } from 'ffjavascript';

class Schnorr {
  prv2pub(prv) {
    let pub = babyJub.mulPointEscalar(babyJub.Base8, prv); //pub  = g^prv where g is the base point of babyjub
    return pub;
  }

  //calculates the signature for schnorr
  signPoseidon(prv, msg, k) {
    //calulcate r = g^k
    const F = babyJub.F;
    const r = babyJub.mulPointEscalar(babyJub.Base8, k);
    //calculate H(r||M) = e where H is the poseidon has function
    // let e = poseidon([F.toObject(r[0]), F.toObject(r[1]), msg]);
    let e = poseidon([r[0], r[1], msg]);
    // e = F.toObject(e);
    //calculate s = k - prv*e
    let s = Scalar.sub(k, Scalar.mul(prv, e));
    s = Scalar.mod(s, babyJub.subOrder); //we must ensure that s is positive and within our subgroup order
    s = Scalar.add(s, babyJub.subOrder);
    s = Scalar.mod(s, babyJub.subOrder);
    //return signature scheme
    return {
      e: e,
      s: s,
    };
  }
  //signature = (s,e)
  //verifies that e_v and e are the same
  verifyPoseidon(sig, y, msg) {
    // Check parameters for schnorr
    const F = babyJub.F;
    if (typeof sig != 'object') return false;
    if (!Array.isArray(y)) return false; // making sure that y
    if (y.length != 2) return false;
    if (!babyJub.inCurve(y)) return false; //making sure that y is on the baby jub curve
    if (sig.s >= babyJub.subOrder) return false;
    const e = sig.e;
    const gs = babyJub.mulPointEscalar(babyJub.Base8, sig.s); //calculates g^s
    const ye = babyJub.mulPointEscalar(y, sig.e); //calculates y^e
    let rv = babyJub.addPoint(gs, ye); //adds g^s and y^e
    // let ev = poseidon([F.toObject(rv[0]), F.toObject(rv[1]), msg]); //H(r_v || M)
    let ev = poseidon([rv[0], rv[1], msg]); //H(r_v || M)
    // ev = F.toObject(ev);
    if (!Scalar.eq(e, ev)) return false; //checks if e == e_v
    return true;
  }
}

export const schnorr = new Schnorr();
