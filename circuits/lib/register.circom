// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 Gelbfeld AG. Licensed under the GNU General Public License v3.0.
// See /licenses/GPL_LICENSE. Portions derived from GPL-3.0 works; see /LICENSE.

pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/compconstant.circom";
include "../../node_modules/circomlib/circuits/escalarmulany.circom";
include "./address.circom";
include "./ecc.circom";

template Register() {
    signal input rootAddress;
    signal input signPublicKey[2];
    signal input viewPublicKey[2];
    signal input viewPrivateKey;

    // The Ethereum address that will own this registration. The proof carries no
    // secret about it and proves nothing about it -- it is declared public purely
    // so the proof is BOUND to one registrant.
    //
    // Without it the proof commits only to (rootAddress, signPublicKey,
    // viewPublicKey), and the EIP-712 struct it is submitted with
    // (RegisterAddress(string message, bytes shieldedAddress)) names no signer
    // either. Anyone observing a registration in the mempool could therefore
    // re-sign the same shieldedAddress with their own key and front-run it,
    // permanently binding the victim's rootAddress to an address of their
    // choosing. That binding is what decom resolves a decrypted note to, so a
    // hijacked registration silently redirects the final step of deanonymisation.
    //
    // Squared so the signal cannot be optimised out of the constraint system.
    signal input publicAddress;
    signal publicAddressSquared <== publicAddress * publicAddress;

    // Caclulate viewPublicKey and constrain it
    component vkMulG = PrivateKeyToPublicKey();
    vkMulG.privateKey <== viewPrivateKey;
    vkMulG.out === viewPublicKey;

    component rootAddr = RootAddress();
    rootAddr.signPublicKey <== signPublicKey;
    rootAddr.viewPrivateKey <== viewPrivateKey;
    rootAddr.out === rootAddress;
}