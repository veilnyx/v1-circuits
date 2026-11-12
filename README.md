# Veilnyx v1-circuits

Circom circuits for the Veilnyx protocol — a shielded pool supporting private transfers of
fungible (ERC20) and non-fungible (ERC721) assets, with built-in encryption of transaction
data for authorized compliance parties.

The circuits are compiled to Groth16 and consumed on-chain via generated Solidity verifiers
(`Verifier*.sol`) and off-chain by the SDK for proof generation.

## Contents

```
circuits/
  lib/            reusable templates (the actual protocol logic)
  main/           concrete `component main` instantiations, one dir per proving key
scripts/          compile + trusted-setup driver
src/compiler.ts   thin wrapper over circom / snarkjs
tests/
  mocks/          single-template circuits used as test harnesses
  helpers/        note, asset, tree and account fixtures
  *.spec.ts       one spec per template
artifacts/        build output (gitignored) — wasm, r1cs, zkey, vKey, Verifier*.sol
audit/scope.md    audit scope, threat model and critical-area breakdown
```

## Circuits

### `transact` — the core circuit

`circuits/lib/transact.circom`, instantiated as `Transact(addrTreeDepth, cmTreeDepth, nIns, nOuts)`.
Every main variant uses an address tree depth of 20 and a commitment tree depth of 25; the
variants differ only in the input/output note counts, so the naming is `transact<nIns><nOuts>`.

One `transact` proof establishes, all at once:

- **Registration** — the spender's root address `H(signPubKey, viewPrivKey)` is in the address tree.
- **Ownership** — a Schnorr signature over the tx hash verifies against the spender's signing key.
- **Membership** — each input commitment is in the commitment tree. Dummy notes
  (`assetId == 0` and `value == 0`) are exempt via the `enabled` flag, which lets a fixed-arity
  circuit serve variable-arity transactions.
- **No double spend** — each revealed nullifier equals `H(pathIndex, commitment, (viewPrivKey · revokerPubKey).x)`,
  binding the nullifier to both the note's tree position and the spender's view key.
- **Value conservation** — per-asset zero-sum over inputs, outputs and the public flow, run
  separately for fungible values and non-fungible counts. `pubFlow` selects deposit (0) vs
  withdrawal (1) direction. Output values are range-limited to 224 bits.
- **Output well-formedness** — declared output commitments match `H(assetId, blindedAddress, value)`
  over blinded addresses derived from the receiver root address and the tx revoker key.
- **Compliance encryption** — note data (`encodeAsset(assetId, value)`, root address, blinding) and
  the refund data are encrypted under Poseidon-cipher keys derived from a seed, and the seed
  itself is ElGamal-encrypted to the compliance group's public key. The circuit constrains that
  the published ciphertexts really decrypt to the values it just proved things about, so an
  authorized decryptor cannot be handed garbage.
- **Ciphertext binding** — all public and encrypted fields are folded into `beta` (chained
  Poseidon(2), computed and constrained in-circuit) and `gamma` (a universal hash evaluated at
  `alpha + beta`). `alpha` is a SHA256 digest of the same data computed outside the circuit, so
  the on-chain contract can bind the calldata it sees to the proof cheaply.

**Public inputs (3):** `alpha`, `beta`, `gamma`. `addressTreeRoot`, `commitmentTreeRoot`, `hash`,
`pubFlow`, `outRevokerPublicKey[2]`, `refundAddress` and `keySeedEncryptionPublicKey[2]` are private
and prepended to the UHF data list, so they enter both the in-circuit `beta` chain and the on-chain
`alpha` chain. (HyperEVM repriced the BN254 precompiles 10x; each public input costs ~61.5k gas.)

Everything else — note values, asset ids, addresses, blindings, path elements, the view private
key and the signature — is private.

### Supporting circuits

| Main circuit | Template | What it proves |
|---|---|---|
| `register` | `Register()` | A root address was correctly derived from a signing key + view key, and the published view public key matches the view private key. Gates entry into the address tree. One public input: `inputsHash = sha256(rootAddress, signPublicKey, viewPublicKey, publicAddress) mod p`. |
| `treeUpdate` | `TreeUpdate(25, 10)` | A batch of 10 leaves was correctly appended to the commitment tree, with zero-padding accounted for. Used by `QueuedMerkleTree.sol` to move insertion cost off-chain. One public input: `inputsHash = sha256(leafIndex, leaves[10], lastRoot, newRoot, nZeroLeaves) mod p`; the subtrees are private and bound to `lastRoot` through the frontier. |

`linkTx` and `anonymityScore` were removed: `linkTx` did not compile and `anonymityScore` was never
deployed (its dummy-note gate had the same flaw as the one fixed in `transact`).

### Library templates

`address`, `commitment`, `nullifier`, `merkleProof`, `ownershipProof`, `schnorr`, `ecc`,
`elGamal`, `poseidonCipher`, `complianceProof`, `zeroSumFungible`, `zeroSumNonFungible`,
`sumValues`, `countAssets`, `fungibility`, `encodeAsset`, `universalHashFunction`, `sha256Fields`, `utils`,
`constants`. Each has a matching spec in `tests/` driven through a mock in `tests/mocks/`.

Two protocol constants worth knowing (`circuits/lib/constants.circom`, `fungibility.circom`):

- Asset ids are 24 bits, values 224 bits — 31 bytes packed, one field element.
- Asset ids below `0x020000` are fungible; at or above are non-fungible.

## Requirements

- Node.js 18+ and `pnpm`
- [`circom`](https://docs.circom.io/getting-started/installation/) **2.1.6+** on `PATH`
- `snarkjs` (installed as a dev dependency)

```bash
pnpm install
```

## Testing

Specs run against the mock circuits in `tests/mocks/` using `circom_tester`, which compiles
each mock on demand into `.tmp/` — no prebuilt artifacts needed.

```bash
pnpm test                          # everything
pnpm test -- tests/transact.spec.ts   # one spec
```


## Building a circuit

```bash
pnpm compile <circuit-id>     # e.g. pnpm compile transact22
```

The id must match a directory under `circuits/main/`. The script compiles to r1cs/wasm/sym,
prints the constraint table, picks the smallest sufficient Powers-of-Tau file (downloading it
into `artifacts/` if absent), runs a Groth16 setup, and ejects a Solidity verifier into
`artifacts/<id>/Verifier<Id>.sol`.

Two things the ejection step does on purpose (`src/compiler.ts`): it renames the contract from
snarkjs's default `Groth16Verifier`, and it replaces `sub(gas(), 2000)` with `not(0)` in the
pairing `staticcall` so the verifier stays callable under EIP-4337 gas accounting.

> **The zkeys produced by `pnpm compile` are not production keys.** `generateKeys` contributes
> a single hardcoded `"test"` entropy string to the phase-2 ceremony. It is fine for local
> development and testing, and unsafe for anything else. Production keys come from a real
> multi-party ceremony.

### Reference constraint counts

From a local build; useful for sizing proving time and picking a ptau power.

| Circuit | Constraints | Private inputs |
|---|---:|---:|
| `register` | 3,698 | 1 |
| `transact21` | 82,682 | 111 |
| `transact22` | 94,269 | 122 |
| `transact23` | 105,900 | 133 |
| `transact42` | 131,833 | 186 |
| `transact44` | 155,271 | 208 |
| `transact82` | 207,225 | 314 |
| `transact84` | 230,927 | 336 |
| `treeUpdate` | 131,356 | 0 |

## Audit

`audit/scope.md` is the scope document for the `transact` circuit and its dependencies —
per-file SLOC, the eight critical security areas with line references, known limitations, and
expected test coverage. Read it before reviewing or modifying anything under `circuits/lib/`.

## License

The circuits are **GPL-3.0-only** (see `LICENSE` and `licenses/GPL_LICENSE`), as derivative
works of iden3/circomlib and the weijiekoh Poseidon-encryption fork. Tests and scripts are MIT.
snarkjs-generated verifier contracts carry their own GPL-3.0 header. Third-party attributions
are listed in `LICENSE`.
