# PaSO: Matching Entries to Presentations — Design

Date: 2026-11-25 · Branch: `draft-3` · Size: small change · Origin: spec review finding #11 (`2026-11-24-spec-review.md`)

## Intent

The Authorizing Party must know which `transaction_data` entry the user signed for each PaSO presentation. Every later check depends on that entry (the matched type, `render_mode`, ad-hoc metadata, payload, risk signals).

Today Verify §3 step 4 recomputes the hash "from *the* entry". It doesn't say:
- which entry applies when the request has several;
- that the entry must target the credential query the presentation answers;
- what happens when one `vp_token` carries several PaSO presentations (advanced profile slots).

The review also claimed OID4VP requires `transaction_data_hashes`. Checked against OID4VP 1.0 final, that is wrong:
- §8.4 leaves the representation of transaction data to the transaction data type.
- `transaction_data_hashes` is an optional profile (App. B.3.3.1) that a type may adopt.

PaSO's singular `transaction_data_hash` is therefore conformant. Each PaSO credential gets exactly one entry (Core §7.4.2).

## Goals

- Verify runs §3 steps 2–6 once per PaSO presentation in the `vp_token`.
- For each presentation, the Authorizing Party finds the **matched entry**:
  - The entry is PaSO-targeted.
  - Its `credential_ids` contain the credential query id under which the presentation appears in the `vp_token`.
  - Its hash equals `transaction_data_hash`.
- If no entry matches, the check fails. The rest of §3 refers to that entry and its `type`.
- The Authorizing Party does not require the matched entry to be the one first-match would select. The Wallet's compatibility evaluation can't be reproduced, and the RP signed every entry. *(Decided by the user.)*
- Core §6.1 states that these claims are PaSO's representation under OID4VP §8.4, and that PaSO does not use `transaction_data_hashes`.
- The hash input is exact: the base64url string as received, not decoded (as OID4VP B.3.3.1 does).
- Algorithm: `sha-256`, unless the applicable rulebook names another. Verify checks exactly that, instead of "acceptable".

## Non-goals

- **The slot model itself** (review #12), including OID4VP §5.1's "use only one of the referenced Credentials" for an entry whose `credential_ids` list several queries.
- **The other Verify checklist gaps** (review #24: `nonce`, `aud`, `iat`, the `jti` window). The `credential_ids` part of #24 is covered here.
- **A request parameter for choosing the algorithm.**

## Approaches considered

- **Chosen: match by hash among the entries targeting the presentation's query.** The Authorizing Party needs nothing beyond what it already holds, and the check is cheap.
- **Rejected: also re-run first-match.** The Authorizing Party can't know which entries the Wallet could fetch, verify or render.
- **Rejected: switch to OID4VP `transaction_data_hashes`.** OID4VP doesn't require it, and PaSO binds exactly one entry per credential.

## Changes

1. **`paso-core.md` §6.1**
   - `transaction_data_hash` row: the hash, computed with `transaction_data_hash_alg`, over the base64url-encoded string of the entry selected for the credential, exactly as it appears in the `transaction_data` request parameter. No base64url decoding is performed before hashing.
   - `transaction_data_hash_alg` row: a hash name string from the IANA "Named Information Hash Algorithm" registry. It **SHALL** be `sha-256`, unless the applicable Transaction Data Type Rulebook names another algorithm.
   - **New paragraph** after the existing one under the table: these claims are PaSO's representation of transaction data in the presentation, which [OID4VP] Section 8.4 leaves to the transaction data type. PaSO does not use the `transaction_data_hashes` and `transaction_data_hashes_alg` parameters of [OID4VP] Appendix B.3.3.1.
2. **`paso-proof-verify.md` §3**
   - **Intro:** step 1 applies once. Steps 2–6 apply to each PaSO presentation, meaning each presentation in the `vp_token` under a credential query id listed in the `credential_ids` of a PaSO-targeted entry.
   - **Step 4, hash bullet:** identify the matched entry as defined in the Goals.
     - If no entry matches, the check fails.
     - Do not require it to be the first entry targeting that query.
     - Within steps 4–6, "the `transaction_data` entry" means the matched entry, and "the matched transaction data type" means its `type`.
   - **Step 4, `_alg` bullet:** verify that it is `sha-256` or the algorithm named by the applicable rulebook.
3. **`2026-11-24-spec-review.md`:**
   - Mark #11 resolved, and note that the OID4VP premise was checked and is wrong for 1.0 final.
   - Next up: #12.

## Calls made (correct if wrong)

- **The `credential_ids` scoping is mandatory.** Without it, a hash of an entry meant for another slot would pass.
- **The definition of "matched entry" sits in step 4,** and steps 5–6 inherit it. This avoids rewording each later reference.
- **No examples change.** A.2 and A.3 already show a single hash with `sha-256`.
- **Section numbers come from OID4VP 1.0 final** (§8.4, App. B.3.3.1), checked today.