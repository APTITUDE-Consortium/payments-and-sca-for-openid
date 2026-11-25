# Matching Entries to Presentations — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** For each PaSO presentation, the Authorizing Party identifies the entry the user signed: by `credential_ids` scope and hash, without re-running first-match. The hash claims are pinned down, and Core states its OID4VP §8.4 basis.

**Architecture:** Documentation-only. One commit per document.

**Tech Stack:** Markdown, MkDocs Material.

**Spec:** `superpowers/specs/2026-11-25-paso-entry-hash-design.md`

## Global Constraints

- No renumbering. Verify §3 keeps steps 1–6.
- Only `paso-core.md` and `paso-proof-verify.md` change under `docs/`. No examples change.
- OID4VP references: Section 8.4 and Appendix B.3.3.1 (OID4VP 1.0 final).
- After every task, `.venv/bin/mkdocs build --strict -d /tmp/paso-site` exits 0.

## Review Focus

- **Cross-slot hash reuse.** A hash of an entry that targets another credential query must not match. The `credential_ids` condition in the step 4 bullet covers this.
- **Several PaSO presentations** in one `vp_token`: each gets steps 2–6, each with its own matched entry and `jti`. Covered by the §3 intro.
- **Versioned fallback (Core A.7).** A Wallet that signed the older entry must pass. Covered by the SHALL NOT in step 4.
- **Rulebook-less ad-hoc types** use `sha-256`, because no rulebook names another algorithm. Covered by the `_alg` wording.
- **Later references** to "the `transaction_data` entry" and "the matched transaction data type" in steps 4–6 resolve to the matched entry. Covered by the definitional sentence; Task 4 greps that no other definition exists.

---

### Task 1: Core §6.1

**Files:** Modify `docs/specifications/paso-core.md` §6.1.

- [ ] **RED**
  - Run: `f=docs/specifications/paso-core.md; for p in 'Default: `sha-256`' 'No base64url decoding is performed before hashing' 'Named Information Hash Algorithm' '[OID4VP] Appendix B.3.3.1'; do printf '%s ' "$(grep -cF "$p" $f)"; done; echo`
  - Expected: `1 0 0 0`
- [ ] **`transaction_data_hash` row.** Replace "Hash of the base64url-encoded `transaction_data` entry selected for the PaSO Credential." with:

  > Hash, computed with `transaction_data_hash_alg`, of the `transaction_data` entry selected for the PaSO Credential, taken over its base64url-encoded string exactly as it appears in the `transaction_data` request parameter. No base64url decoding is performed before hashing.

- [ ] **`transaction_data_hash_alg` row.** Replace "Hash algorithm identifier. Default: `sha-256`." with:

  > Hash algorithm identifier, a "Hash Name String" from the IANA "Named Information Hash Algorithm" registry. **SHALL** be `sha-256`, unless the applicable Transaction Data Type Rulebook names another algorithm.

- [ ] **New paragraph** after the paragraph ending "…and its absence does not negate it.":

  > These claims are PaSO's representation of the transaction data in the presentation, which [OID4VP] Section 8.4 leaves to the transaction data type. PaSO does not use the `transaction_data_hashes` and `transaction_data_hashes_alg` parameters of [OID4VP] Appendix B.3.3.1.

- [ ] **GREEN**
  - Run the RED loop. Expected: `0 1 1 1`.
  - Then run the strict build. Expected: exit 0.
- [ ] **Commit:** `docs: core pins the transaction data hash input and algorithm`

### Task 2: Verify §3

**Files:** Modify `docs/specifications/proof/paso-proof-verify.md` §3.

- [ ] **RED**
  - Run: `f=docs/specifications/proof/paso-proof-verify.md; for p in 'verify the algorithm is acceptable' 'Steps 2 to 6 apply to each PaSO presentation' 'identify the matched entry' 'require the matched entry to be the first entry' 'Verify the PaSO Credential of the presentation'; do printf '%s ' "$(grep -cF "$p" $f)"; done; echo`
  - Expected: `1 0 0 0 0`
- [ ] **Intro.** Replace "Upon receiving the proof package, the Authorizing Party **SHALL** perform the following checks:" with:

  > Upon receiving the proof package, the Authorizing Party **SHALL** perform the following checks. Step 1 applies once. Steps 2 to 6 apply to each PaSO presentation, that is, each presentation in the `vp_token` under a credential query identifier listed in the `credential_ids` of a PaSO-targeted `transaction_data` entry ([PaSO Core] Section 7.3).

- [ ] **Step 2.** "Verify the PaSO Credential in the `vp_token`:" → "Verify the PaSO Credential of the presentation:".
- [ ] **Step 4, hash bullet.** Replace "`transaction_data_hash`: recompute the hash from the `transaction_data` entry in the Authorization Request and verify it matches." with:

  > `transaction_data_hash`: identify the matched entry. It is the PaSO-targeted `transaction_data` entry whose `credential_ids` contain the credential query identifier under which the presentation appears in the `vp_token`, and whose hash, computed per [PaSO Core] Section 6.1, equals `transaction_data_hash`. If no entry matches, the check fails. The Authorizing Party **SHALL NOT** require the matched entry to be the first entry that targets that credential query ([PaSO Core] Section 7.4.2 step 2). The Relying Party signed every entry, and the Wallet's compatibility evaluation cannot be reproduced. In steps 4 to 6, "the `transaction_data` entry" refers to the matched entry, and "the matched transaction data type" to its `type`.

- [ ] **Step 4, `_alg` bullet.** Replace "verify the algorithm is acceptable." with "verify that it is `sha-256`, or the algorithm named by the applicable Transaction Data Type Rulebook."
- [ ] **GREEN**
  - Run the RED loop. Expected: `0 1 1 1 1`.
  - Then run the strict build. Expected: exit 0.
- [ ] **Commit:** `docs: verify matches each PaSO presentation to its signed entry`

### Task 3: Review doc

**Files:** Modify `superpowers/specs/2026-11-24-spec-review.md` header.

- [ ] **RED**
  - Run: `f=superpowers/specs/2026-11-24-spec-review.md; grep -cF '#11 — the Authorizing Party matches' $f; grep -cF 'Next up:** #12' $f; grep -cF 'checked with #11' $f`
  - Expected: `0`, `0`, `0`
- [ ] **Resolved line.** Append:

  > #11 — the Authorizing Party matches each PaSO presentation to the entry whose `credential_ids` contain the presentation's credential query and whose hash matches, without re-running first-match; `sha-256` unless the rulebook names another algorithm; the review's claim that OID4VP requires `transaction_data_hashes` is wrong for 1.0 final (§8.4, App. B.3.3.1) (design `2026-11-25-paso-entry-hash-design.md`, commits `<first>`..`<last>` of Tasks 1–2).

- [ ] **Next up.** Replace the "#11 — hashes for multiple entries (…)." sentence with:

  > #12 — two different selection models (Core §7.4.1 independent slots vs. §7.4.2 "the selected credential"; one screen vs. per-credential `render_mode`/`display_locale`; `∅` not mapped to DCQL; OID4VP §5.1 "use only one of the referenced Credentials").

  Keep the deferred-minors list.
- [ ] **Handoff line.** "#10 done (commits …)." → "#11 done (commits `<first>`..`<last>`)."
- [ ] **Scope note (l.10).** After "were not checked against the published documents." append " (The `transaction_data_hashes` claim was checked with #11: OID4VP 1.0 final does not require it.)"
- [ ] **GREEN**
  - Run the RED greps. Expected: `1`, `1`, `1`.
- [ ] **Commit:** `docs: mark spec review finding #11 resolved`

### Task 4: Branch check

- [ ] Run: `git diff --stat <plan commit>..HEAD -- docs/`
  - Expected: only `paso-core.md` and `paso-proof-verify.md`.
- [ ] Run: `grep -c 'matched entry' docs/specifications/proof/paso-proof-verify.md`
  - Expected: `3` (identify, SHALL NOT, refers to). The only definition is in step 4.
- [ ] Run: `rg -n 'transaction_data_hashes' docs`
  - Expected: only the new Core §6.1 paragraph.
- [ ] Run the strict build. Expected: exit 0.