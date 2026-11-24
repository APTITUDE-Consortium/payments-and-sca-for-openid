# Who Checks the Rulebook — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wallet rulebook checks apply only to rulebooks the Wallet implements. Each role's rulebook duties are stated in Core. Ad-hoc-only types need no rulebook.

**Architecture:** Documentation-only. Core first, then the documents that reference it. One commit per document.

**Tech Stack:** Markdown, MkDocs Material.

**Spec:** `superpowers/specs/2026-11-24-paso-rulebook-checks-design.md`

## Global Constraints

- No renumbering of existing sections. The new Core section is §5.5, inserted after §5.4 "Content Quality" and before "## 6 Holder Binding Proof".
- Metadata stays mandatory for every type. `paso-proof-metadata.md` and `paso-view.md` are not edited.
- Ad-hoc overrides of risk configuration (review #9) are out of scope. The ad-hoc paragraph at the end of Risk §4.1 stays verbatim.
- After every task, `.venv/bin/mkdocs build --strict -d /tmp/paso-site` exits 0.

## Review Focus

- **The Authorizing Party must still apply rulebook risk sources.** Risk §4.1 gains "where the Wallet implements" qualifiers. Verify §3 step 6 resolves the set "per Risk §4.1", so without an explicit sentence the AP could read itself out of the rulebook sources. Task 2 adds that sentence and checks for it.
- **The claim-`path` check stays unconditional** in Core §7.5 condition 3. Only the "not declared by the rulebook" clause becomes conditional. Task 1 checks both.
- **The immutability rule for published rulebooks is unchanged.** Only ad-hoc-only types are exempt. Task 1 checks that the §5.3 sentence survives.
- **The ad-hoc risk paragraph is untouched**, so #9 starts from the current text. Task 2 checks it verbatim.
- **View is untouched.** Static eligibility already requires the Wallet to implement the rulebook. Task 6 checks `git diff` across the branch.

---

### Task 1: Core §5.1, new §5.5, §7.5, references

**Files:** Modify `docs/specifications/paso-core.md` §5.1, §7.5, §8; add §5.5.

- [ ] **RED**
  - Run: `f=docs/specifications/paso-core.md; grep -c "^### 5.5 Rulebook Obligations" $f; grep -c "except a type used only with ad-hoc metadata" $f; grep -c "does not contain fields not declared by the rulebook" $f; grep -c "^| \[PaSO Proof Verify\]" $f`
  - Expected: `0`, `0`, `1`, `0`
- [ ] **§5.1.** Replace the sentence "Every transaction data type identifier used with PaSO **SHALL** have a Transaction Data Type Rulebook published by the organisation that owns the identifier." with:

  > Every transaction data type identifier used with PaSO **SHALL** have a Transaction Data Type Rulebook published by the organisation that owns the identifier, except a type used only with ad-hoc metadata per [PaSO Proof Metadata] Section 5. For such a type, the ad-hoc metadata supplied by the Relying Party is the complete definition of the type for the transaction it accompanies, and Section 5.3, including its immutability requirement, does not apply.

- [ ] **New §5.5**, after §5.4:

  > ### 5.5 Rulebook Obligations
  >
  > Conformance to a Transaction Data Type Rulebook is ensured by the parties that construct and verify transaction data:
  >
  > - The Attestation Provider **SHALL** ensure that the `transaction_data_types` entry it publishes for a transaction data type in the signed credential metadata ([PaSO Proof Metadata] Section 3) is consistent with the rulebook. This includes the claims and which of them are required, and any risk signal profiles, risk signals and encryption that the rulebook requires ([PaSO Risk Signals]).
  > - The Relying Party **SHALL** construct the `payload` of a `transaction_data` entry per the rulebook of its `type`. For a type used only with ad-hoc metadata (Section 5.1), it **SHALL** construct the `payload` per that metadata.
  > - The Authorizing Party **SHALL** verify that the `payload` conforms to the rulebook, per [PaSO Proof Verify] Section 3.
  >
  > A Wallet implements a rulebook by building it in; it does not obtain rulebooks at runtime. The Wallet **SHALL** apply the requirements of every rulebook it implements. For a rulebook it does not implement, the Wallet relies on the credential metadata, which reflects the rulebook by the Attestation Provider's obligation above.

- [ ] **§7.5 condition 3.** Replace the sentence beginning "A `payload` conforms if" with:

  > A `payload` conforms if it does not contain fields not covered by a claim `path` in the applicable claims metadata (companion `#integrity` fields are covered by the `path` of the claim they accompany), all fields declared as required are present, all display formatting directives are supported by the Wallet, and all values conform to their declared formatting. Where the Wallet implements the rulebook of the `type` (Section 5.5), the `payload` additionally **SHALL NOT** contain fields not declared by the rulebook.

- [ ] **§7.5 decision path.** After the paragraph "Other PaSO specifications define further conditions…", add:

  > The following summary is informative. For each entry and candidate credential, the Wallet determines the definition of the type as follows:
  >
  > 1. If the entry carries a `metadata` parameter, the Wallet verifies it per [PaSO Proof Metadata] Section 5.3. Invalid ad-hoc metadata makes the entry incompatible, without fallback to the stored credential metadata. Valid ad-hoc metadata is the definition of the type for this transaction, and the entry is rendered dynamically ([PaSO View] Section 5.1).
  > 2. Otherwise, the type is supported only if the signed credential metadata lists it (condition 2). The `payload` is checked against that metadata and, where the Wallet implements it, against the rulebook (condition 3).
  > 3. The Wallet then selects the rendering mode: static rendering where [PaSO View] Section 5.1 permits it, and dynamic rendering from the metadata otherwise.

- [ ] **§8.** After the `[PaSO Risk Signal Registry]` row, add a row `[PaSO Proof Verify]` → `[PaSO Proof: Verify Module](proof/paso-proof-verify.md)`, padded to the table's column widths.
- [ ] **GREEN**
  - Run the RED greps. Expected: `1`, `1`, `0`, `1`.
  - Run: `grep -c "additionally \*\*SHALL NOT\*\* contain fields not declared by the rulebook" $f; grep -c "does not contain fields not covered by a claim .path." $f; grep -c "semantic structure \*\*SHALL\*\* be immutable once published" $f`
  - Expected: `1`, `1`, `1`
  - Then run the strict build. Expected: exit 0.
- [ ] **Commit:** `docs: core states rulebook obligations by role and conditions wallet rulebook checks`

### Task 2: Risk Signals §4.1 and §7.2

**Files:** Modify `docs/specifications/proof/paso-proof-risk-signals.md` §4.1, §7.2.

- [ ] **RED**
  - Run: `f=docs/specifications/proof/paso-proof-risk-signals.md; grep -c "where the Wallet implements" $f; grep -c "Authorizing Party always includes" $f`
  - Expected: `0`, `0`
- [ ] **§4.1 step 1, second bullet.** Change it to: "the profiles referenced for the transaction data type by its Transaction Data Type Rulebook (per [PaSO Core] Section 5), where the Wallet implements that rulebook ([PaSO Core] Section 5.5)."
- [ ] **§4.1 step 3.** Change "and any signals enumerated directly by the Transaction Data Type Rulebook," to "and, where the Wallet implements the Transaction Data Type Rulebook, any signals it enumerates directly,".
- [ ] **§4.1, after "Where neither source references a profile…".** Add:

  > A Wallet that does not implement the rulebook relies on the signed credential metadata, which the Attestation Provider keeps consistent with the rulebook per [PaSO Core] Section 5.5. When resolving the effective signal set for verification (Section 6), the Authorizing Party always includes the profiles and signals that the rulebook references or enumerates.

- [ ] **§7.2 item 1.** Change "the applicable Transaction Data Type Rulebook," to "the applicable Transaction Data Type Rulebook, where the Wallet implements it ([PaSO Core] Section 5.5),".
- [ ] **GREEN**
  - Run the RED greps. Expected: `3`, `1`
  - Run: `grep -c "^Where the .transaction_data. entry carries ad-hoc metadata valid per .PaSO Proof Metadata. Section 5.3, the .risk_signal_profiles." $f`
  - Expected: `1`. That paragraph must show no change in `git diff`.
  - Then run the strict build. Expected: exit 0.
- [ ] **Commit:** `docs: risk signals apply rulebook sources where the wallet implements the rulebook`

### Task 3: Verify §3 step 5

**Files:** Modify `docs/specifications/proof/paso-proof-verify.md` §3 step 5.

- [ ] **RED**
  - Run: `grep -c "used only with ad-hoc metadata" docs/specifications/proof/paso-proof-verify.md`
  - Expected: `0`
- [ ] **Edit.** After "The specific checks are defined by the rulebook." append:

  > Where the type has no rulebook because it is used only with ad-hoc metadata ([PaSO Core] Section 5.1), verify instead that the `payload` conforms to the `metadata` object of the entry, per [PaSO Core] Section 7.5 condition 3.

- [ ] **GREEN**
  - Run the same grep. Expected: `1`.
  - Then run the strict build. Expected: exit 0.
- [ ] **Commit:** `docs: verify checks ad-hoc-only payloads against their metadata`

### Task 4: Intro §6.2

**Files:** Modify `docs/index.md` §6.2.

- [ ] **RED**
  - Run: `grep -c "without a published rulebook" docs/index.md; grep -c "publishing its metadata and rulebook" docs/index.md`
  - Expected: `1`, `1`
- [ ] **Ad-hoc bullet.** Change its opening to: "For transaction types that have no rulebook — for example, a bank's own login or limit-change interactions — a Relying Party that the signed credential metadata authorises (`adhoc_metadata_clients`) may instead supply the type's complete definition **ad hoc**, as metadata inside the `transaction_data` entry of its signed request". Keep the rest of the bullet.
- [ ] **"The consequence is decisive" paragraph.** Change "by the issuer publishing its metadata and rulebook" to "by its owner publishing a rulebook and the issuer publishing matching metadata".
- [ ] **GREEN**
  - Run the RED greps. Expected: `0`, `0`.
  - Then run the strict build. Expected: exit 0.
- [ ] **Commit:** `docs: intro describes ad-hoc metadata as the complete definition of rulebook-less types`

### Task 5: Review doc

**Files:** Modify `superpowers/specs/2026-11-24-spec-review.md` header lines 6–7.

- [ ] **RED**
  - Run: `grep -c "#4 — " superpowers/specs/2026-11-24-spec-review.md`
  - Expected: `0`
- [ ] **Resolved line.** Append: "#4 — Wallets check rulebooks only where they implement them, otherwise metadata; role obligations in Core §5.5; ad-hoc-only types need no rulebook (design `2026-11-24-paso-rulebook-checks-design.md`, commits `<first>`..`<last>` of Tasks 1–4)."
- [ ] **Next up line.** Replace it with: "**Next up:** #9 — ad-hoc metadata replaces the signed risk configuration (Risk §4.1, final paragraph). Deferred minors so far: Core §6.1 omits optional risk signals (#23); View §5.2 limits per-credential `render_mode` differences to the advanced profile."
- [ ] **GREEN**
  - Run the same grep. Expected: `1`.
- [ ] **Commit:** `docs: mark spec review finding #4 resolved`

### Task 6: Branch check

- [ ] Run: `git diff --stat 62c1ffb..HEAD -- docs/`
  - Expected: changes only in `index.md`, `paso-core.md`, `paso-proof-risk-signals.md` and `paso-proof-verify.md`. No `paso-view.md` and no `paso-proof-metadata.md`.
- [ ] Run the strict build. Expected: exit 0.
