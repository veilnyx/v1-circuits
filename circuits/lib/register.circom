// SPDX-License-Identifier: GPL-3.0-only
// Copyright (c) 2026 Gelbfeld AG. Licensed under the GNU General Public License v3.0.
// See /licenses/GPL_LICENSE. Portions derived from GPL-3.0 works; see /LICENSE.

pragma circom 2.1.5;

include "../../node_modules/circomlib/circuits/compconstant.circom";
include "../../node_modules/circomlib/circuits/escalarmulany.circom";
include "./address.circom";
include "./ecc.circom";
include "./sha256Fields.circom";

template Register() {
    signal input rootAddress;
    signal input signPublicKey[2];
    signal input viewPublicKey[2];
    signal input viewPrivateKey;

    // The Ethereum address that will own this registration. The proof carries no
    // secret about it and proves nothing about it -- it is bound purely so the
    // proof belongs to one registrant (front-running protection, see git history).
    signal input publicAddress;

    // The single public input. HyperEVM repriced the BN254 precompiles 10x, so the
    // six values above are hashed into one instead of being six public inputs:
    //   inputsHash = sha256(rootAddress || signPublicKey || viewPublicKey || publicAddress) mod p
    // which the contract computes as
    //   sha256(abi.encodePacked(shieldedAddress, uint256(uint160(publicAddress)))) % FIELD_SIZE.
    signal input inputsHash;
    component inputsHasher = Sha256Fields(6);
    inputsHasher.in[0] <== rootAddress;
    inputsHasher.in[1] <== signPublicKey[0];
    inputsHasher.in[2] <== signPublicKey[1];
    inputsHasher.in[3] <== viewPublicKey[0];
    inputsHasher.in[4] <== viewPublicKey[1];
    inputsHasher.in[5] <== publicAddress;
    inputsHasher.out === inputsHash;

    // Caclulate viewPublicKey and constrain it
    component vkMulG = PrivateKeyToPublicKey();
    vkMulG.privateKey <== viewPrivateKey;
    vkMulG.out === viewPublicKey;

    component rootAddr = RootAddress();
    rootAddr.signPublicKey <== signPublicKey;
    rootAddr.viewPrivateKey <== viewPrivateKey;
    rootAddr.out === rootAddress;
}