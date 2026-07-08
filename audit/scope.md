# Audit Scope Document

## Overview

This document defines the audit scope for the `transact.circom` circuit and its dependencies in the v1-circuits repository.

**Primary Circuit:** `circuits/lib/transact.circom`  
**Circuit Version:** Circom 2.1.6  
**Repository:** veilnyx/v1-circuits (dev branch)

## Circuit Purpose

The `Transact` template is the core zero-knowledge circuit for private transactions in the protocol. It enables shielded transfers of both fungible (ERC20) and non-fungible (ERC721) assets while maintaining privacy, enforcing compliance, and proving ownership without revealing sensitive information.

### Key Features

- **Privacy-preserving transactions**: Hides transaction amounts, asset types, and participant identities
- **Merkle tree verification**: Validates inclusion of input commitments in the commitment tree
- **Nullifier generation**: Prevents double-spending through unique nullifiers
- **Zero-sum constraints**: Ensures value conservation for fungible and non-fungible assets
- **Compliance encryption**: Encrypts transaction data for authorized auditors (revoker + guardian groups)
- **Multi-asset support**: Handles multiple inputs and outputs with different asset types
- **Public flow handling**: Supports deposits (inflow) and withdrawals (outflow) from/to public addresses

### Circuit Parameters

```circom
template Transact(addrTreeDepth, cmTreeDepth, nIns, nOuts)
```

- **addrTreeDepth**: Depth of the address merkle tree
- **cmTreeDepth**: Depth of the commitment merkle tree  
- **nIns**: Number of input notes (variable)
- **nOuts**: Number of output notes (variable)

## In-Scope Libraries

The following table lists all library dependencies used by `transact.circom`:

| Library | SLOC | Description | Critical Areas |
|---------|------|-------------|----------------|
| **transact.circom** | 306 | Main transaction circuit coordinating all privacy and compliance checks | Complete circuit logic, input/output validation, constraint system |
| **utils.circom** | 42 | Utility templates for bit operations and range checks | `LimitRange`, `CastToBits`, `Sum` templates |
| **address.circom** | 48 | Address derivation and blinded address computation | `RootAddress`, `BlindedAddress`, `BlindedAddressCheck` |
| **nullifier.circom** | 25 | Nullifier generation to prevent double-spending | Nullifier computation using view key and commitment |
| **commitment.circom** | 16 | Note commitment hashing | Commitment scheme using Poseidon hash |
| **merkleProof.circom** | 35 | Merkle tree inclusion proof verification | Conditional verification for dummy notes |
| **ownershipProof.circom** | 16 | Schnorr signature verification for transaction authorization | Signature validation logic |
| **complianceProof.circom** | 110 | Compliance encryption for auditor access | ElGamal encryption, key derivation, note decryption |
| **zeroSumFungible.circom** | 42 | Zero-sum validation for fungible (ERC20) assets | Value conservation across inputs/outputs |
| **zeroSumNonFungible.circom** | 50 | Zero-sum validation for non-fungible (ERC721) assets | NFT count conservation across inputs/outputs |
| **universalHashFunction.circom** | 20 | Universal hash function for encrypted data integrity | Polynomial evaluation over encrypted inputs |
| **ecc.circom** | 44 | Elliptic curve operations (Baby Jubjub) | Point multiplication, private to public key conversion |
| **schnorr.circom** | 69 | Schnorr signature verification implementation | Signature verification on Baby Jubjub curve |
| **elGamal.circom** | 61 | ElGamal encryption for compliance | Hashed ElGamal encryption scheme |
| **encodeAsset.circom** | 32 | Asset encoding (assetId + value packing) | 24-bit assetId + 224-bit value encoding |
| **poseidonCipher.circom** | 250 | Poseidon-based encryption/decryption | Symmetric encryption for note data |
| **sumValues.circom** | 24 | Summation of values for specific asset types | Selective sum accumulation |
| **fungibility.circom** | 24 | Asset type classification (fungible vs non-fungible) | Asset ID range checks |
| **countAssets.circom** | 30 | Count specific NFTs in input/output sets | NFT occurrence counting |
| **treeUpdate.circom** | 153 | Merkle tree batch update circuit for commitment tree maintenance, used by the QueuedMerkleTree.sol contract |
| **register.circom** | 22 | User registration circuit for address creation | Root address derivation, public key validation |

**Total In-Scope SLOC:** 1,419 lines

## External Dependencies

The circuits also depend on the following external libraries (not in audit scope unless specified):

- **circomlib**: Standard Circom library providing:
  - `bitify.circom`: Bit conversion utilities
  - `poseidon.circom`: Poseidon hash function
  - `comparators.circom`: Comparison operations
  - `switcher.circom`: Conditional routing
  - `escalarmulany.circom`: Elliptic curve scalar multiplication
  - `compconstant.circom`: Constant comparison
  
- **@zk-kit/poseidon-cipher.circom**: Poseidon cipher constants

## Critical Security Areas

### 1. Nullifier Uniqueness
- **Location**: `nullifier.circom`, `transact.circom` (lines 109-114)
- **Risk**: Double-spending if nullifiers can collide or be predicted
- **Verification**: Ensure nullifier computation is deterministic and collision-resistant

### 2. Merkle Proof Validation
- **Location**: `merkleProof.circom`, `transact.circom` (lines 118-128)
- **Risk**: Invalid commitments being accepted if proof verification is bypassed
- **Verification**: Check dummy note handling (assetId == 0 AND value == 0)
- **Note**: The enabled flag uses the formula: `(inAssetIds[i] + inValues[i]) + (inAssetIds[i] * inValues[i])`

### 3. Zero-Sum Constraints
- **Location**: `zeroSumFungible.circom`, `zeroSumNonFungible.circom`, `transact.circom` (lines 156-212)
- **Risk**: Value creation/destruction if conservation is not properly enforced
- **Verification**: Validate sum constraints for all asset types, including public flows

### 4. Ownership Proof
- **Location**: `ownershipProof.circom`, `schnorr.circom`, `transact.circom` (lines 115-117)
- **Risk**: Unauthorized spending if signature verification is flawed
- **Verification**: Ensure Schnorr signature correctly binds to transaction hash

### 5. Compliance Encryption
- **Location**: `complianceProof.circom`, `transact.circom` (lines 289-302)
- **Risk**: Privacy leak or inability to decrypt for compliance
- **Verification**: 
  - ElGamal encryption correctness
  - Key derivation from seed
  - Note and refund data encryption/decryption

### 6. Universal Hash Function
- **Location**: `universalHashFunction.circom`, `transact.circom` (lines 274-278)
- **Risk**: Integrity of encrypted data not guaranteed
- **Verification**: Check polynomial evaluation correctness of encrypted data and binding property

### 7. Address Derivation
- **Location**: `address.circom`, `transact.circom` (lines 69-93)
- **Risk**: Address collision or predictability
- **Verification**: Root address and blinded address computation integrity

### 8. Range Checks
- **Location**: `utils.circom`, `transact.circom` (lines 130-134)
- **Risk**: Overflow or underflow in value fields
- **Verification**: Ensure output values are limited to 224 bits

## Input/Output Structure

### Public Inputs
- `addressTreeRoot`: Merkle root of registered addresses
- `commitmentTreeRoot`: Merkle root of note commitments
- `hash`: Transaction hash to be signed
- `pubFlow`: Direction (0 = inflow/deposit, 1 = outflow/withdrawal)
- `outRevokerPublicKey`: Public key of the choosen revoker for the tx
- `refundAddress`: The address of the sender, who will receive the refund UTXOs
- `keySeedEncryptionPublicKey`: The public key of the compliance group for the tx
- `alpha`: Sequential hash of all encrypted values using SHA256 (not computed in circuits)
- `beta`: Sequential hash of all encrypted values using Poseidon(2). Computed and constrained inside the circuit.
- `gamma`: Universal hash function output

### Private Inputs
- Registration: `addressPathIndex`, `addressPathElements[addrTreeDepth]`

- Input notes: `pubAssetIds[nOuts]`, `pubValues[nOuts]`, `inViewPrivateKey`, `inSignPublicKey[2]`, `inRevokerPublicKeys[nIns][2]`, `inAssetIds[nIns]`, `inValues[nIns]`, `inBlindings[nIns]`, `inPathIndices[nIns]`, `inPathElements[nIns][cmTreeDepth]`, `inNullifiers[nIns]`

- Output notes:
`outRevokerPublicKey[2]`, `outAssetIds[nOuts]`, `outRootAddresses[nOuts]`, `outValues[nOuts]`, `outBlindings[nOuts]`, `outCommitments[nOuts]`, `encryptedNoteData[nOuts][4]`

- Refund: `refundAddress`, `refundAddressBlinding`, `encryptedRefundData[4]`

- Compliance: `keySeedEncryptionEphemeralKey`, `keySeedEncryptionPublicKey[2]`, `dataEncryptionKeySeed`, , `encryptedDataEncryptionKeySeed[3]`

- Signature: `signature[2]`

## Testing Requirements

The following test coverage is expected:

1. **Happy path**: Valid transactions with various input/output configurations
2. **Edge cases**:
   - Dummy notes (assetId = 0, value = 0)
   - Maximum values (224-bit boundary)
   - Single input/output
   - Maximum inputs/outputs
3. **Negative tests**:
   - Invalid merkle proofs
   - Incorrect signatures
   - Value conservation violations
   - Double-spending attempts
   - Invalid nullifiers
   - Malformed encrypted data
4. **Asset type mixing**: Fungible and non-fungible in same transaction
5. **Public flows**: Deposits, Transfer, Withdrawals, External DeFi protocol txs
6. **Compliance**: Encryption correctness

## Known Limitations

1. **Dummy notes**: Notes with `assetId == 0 AND value == 0` skip merkle proof verification
2. **Value size**: Output values are limited to 224 bits (MAX_BITS_VALUE)
3. **Asset ID encoding**: AssetId uses 24 bits, value uses 224 bits in encoded form
4. **Fungibility boundary**: Assets with ID < 0x020000 are fungible, >= 0x020000 are non-fungible
5. **Commented code**: Three hash-related includes are commented out (lines 12-14)

## Audit Focus Areas

1. **Constraint completeness**: Verify all security properties are enforced by constraints
2. **Underconstraint detection**: Identify any unconstrained signals or missing checks
3. **Arithmetic safety**: Check for overflow, underflow, and division by zero
4. **Cryptographic assumptions**: Validate Poseidon, Schnorr, and ElGamal implementations
5. **Privacy guarantees**: Ensure no information leakage through public signals
6. **Compliance vs privacy**: Balance between regulatory compliance and user privacy
7. **Gas optimization**: Assess constraint count and potential optimizations

## Success Criteria

The audit is considered successful when:

- [ ] All constraints are verified to enforce intended security properties
- [ ] No underconstraint or overconstraint issues exist
- [ ] Cryptographic primitives are correctly implemented
- [ ] Privacy guarantees are maintained
- [ ] Value conservation is always enforced
- [ ] Double-spending is provably impossible
- [ ] Compliance encryption is correct and auditable
- [ ] All edge cases are properly handled
- [ ] Test coverage meets requirements

## Contact Information

**Repository**: https://github.com/veilnyx/v1-circuits  
**Branch**: dev  
**Primary Circuit**: circuits/lib/transact.circom  
**Circom Version**: 2.1.6
