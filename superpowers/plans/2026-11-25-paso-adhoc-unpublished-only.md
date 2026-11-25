# Ad-hoc Metadata Only for Unpublished Types — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ad-hoc metadata is valid only for types the credential's signed metadata does not list. The Wallet enforces this, the Authorizing Party checks it, and all override wording is removed.

**Architecture:** Documentation-only. One commit per document.

**Tech Stack:** Markdown, MkDocs Material.

**Spec:** `superpowers/specs/2026-11-25-paso-adhoc-unpublished-only-design.md`

## Global Constraints

- No renumbering. The §5.3 checks gain step 5. Metadata §5.4 keeps its number and is retitled "Processing".
- Metadata A.4 and A.7 are unchanged. `paso-view.md` and `index.md` are not edited.
- The §5.3 failure rule (invalid, incompatible, no fallback) stays verbatim.
- After every task, `.venv/bin/mkdocs build --strict -d /tmp/paso-site` exits 0.

## Review Focus

- **Versioned fallback (Core A.7).** An entry with ad-hoc metadata for an unpublished newer type, listed before a published older type, must still fall through to the older entry when the ad-hoc check fails. The per-credential incompatibility rule gives this; Task 1 keeps the no-fallback sentence verbatim, and it concerns the stored entry for the *same* `transaction_data` entry only.
- **Multi-credential entries.** The new check is per targeted credential. An entry whose type is published for one targeted credential is incompatible only with that credential.
- **Risk configuration for unpublished types** still comes from the ad-hoc `metadata` object, and rulebook sources still apply (#4). Task 2 keeps both.
- **Authorizing Party symmetry.** Verify §3 step 4 must check the same condition as the Wallet's new step 5. Task 3.
- **No other override wording remains.** Task 6 greps the whole of `docs/` for "in place of", "takes precedence" and "instead" near ad-hoc metadata.

---

### Task 1: Metadata §3, §5, §5.1, §5.3, §5.4, A.5

**Files:** Modify `docs/specifications/proof/paso-proof-metadata.md`.

- [ ] **RED**
  - Run: `f=docs/specifications/proof/paso-proof-metadata.md; grep -c "takes precedence for the individual transaction" $f; grep -c "Instead of relying solely" $f; grep -c "in place of the corresponding .transaction_data_types. entry" $f; grep -c "even if it is absent from the signed credential metadata" $f; grep -c "whose .type. is listed in .transaction_data_types." $f; grep -c "^5\. Verify that the .type. of the .transaction_data. entry is not listed" $f; grep -c "^### 5.4 Processing" $f; grep -c "may supply ad-hoc metadata only for other types" $f`
  - Expected: `1 1 1 1 0 0 0 0` (one per line)
- [ ] **§3.** In the "A PaSO Credential **SHALL NOT** be accepted" paragraph, replace "is the authoritative source for the credential metadata, except that ad-hoc transaction data metadata supplied per Section 5 takes precedence for the individual transaction it accompanies;" with:

  > is the authoritative source for the credential metadata; for a transaction data type it does not list, ad-hoc transaction data metadata supplied per Section 5 serves as the metadata for the individual transaction it accompanies;

- [ ] **§5 intro.** Replace "Instead of relying solely on the corresponding entry in the signed credential metadata JWT, the metadata for a transaction data type **MAY** be supplied ad hoc" with:

  > For a transaction data type that the signed credential metadata JWT does not list, the metadata **MAY** be supplied ad hoc

- [ ] **§5.1.** After the paragraph "A Relying Party **SHALL NOT** include a `metadata` parameter … of every credential the entry targets.", add:

  > A Relying Party **SHALL NOT** include a `metadata` parameter in a `transaction_data` entry whose `type` is listed in `transaction_data_types` of the signed credential metadata of any credential the entry targets. Ad-hoc metadata defines transaction data types the Attestation Provider does not publish; it does not override published ones.

- [ ] **§5.3.** After step 4, add:

  > 5. Verify that the `type` of the `transaction_data` entry is not listed in `transaction_data_types` of that JWT.

- [ ] **§5.4.**
  - Heading: `### 5.4 Precedence and Processing` → `### 5.4 Processing`.
  - First bullet → "It **SHALL** be used as the metadata of the transaction data type, for this transaction only."
  - Second bullet: delete ", even if it is absent from the signed credential metadata", so it ends "…for the purposes of [PaSO Core] Section 7."
- [ ] **A.5 intro.** After "…applies to [SD-JWT-VC] credentials." append: "Because this JWT publishes `urn:paso:sca:global:payment:1`, the authorised Relying Parties may supply ad-hoc metadata only for other types (Section 5.1)."
- [ ] **GREEN**
  - Run the RED greps. Expected: `0 0 0 0 1 1 1 1`
  - Run: `grep -c "SHALL NOT\*\* fall back to the stored credential metadata entry" $f`. Expected: `1`.
  - Then run the strict build. Expected: exit 0.
- [ ] **Commit:** `docs: metadata allows ad-hoc metadata only for unpublished types`

### Task 2: Risk Signals §4.1, last paragraph

**Files:** Modify `docs/specifications/proof/paso-proof-risk-signals.md` §4.1.

- [ ] **RED**
  - Run: `f=docs/specifications/proof/paso-proof-risk-signals.md; grep -c "are taken from that .metadata. object instead" $f; grep -c "the type is not listed in the signed credential metadata" $f`
  - Expected: `1`, `0`
- [ ] **Edit.** Replace the paragraph beginning "Where the `transaction_data` entry carries ad-hoc metadata valid per" with:

  > Where the `transaction_data` entry carries ad-hoc metadata valid per [PaSO Proof Metadata] Section 5.3, the type is not listed in the signed credential metadata ([PaSO Proof Metadata] Section 5.1). The `risk_signal_profiles`, `risk_signals`, and `encrypted` members that this section and Section 7.2 take from the signed credential metadata are therefore taken from that `metadata` object, per [PaSO Proof Metadata] Section 5.4. The rulebook sources apply as for any other entry. The issuer encryption key is obtained from the signed credential metadata per Section 7.3.

- [ ] **GREEN**
  - Run the RED greps. Expected: `0`, `1`.
  - Then run the strict build. Expected: exit 0.
- [ ] **Commit:** `docs: risk signals take ad-hoc risk members only for unpublished types`

### Task 3: Verify §3 step 4, ad-hoc bullet

**Files:** Modify `docs/specifications/proof/paso-proof-verify.md` §3 step 4.

- [ ] **RED**
  - Run: `grep -c "that the entry's .type. is not listed in .transaction_data_types. of that JWT" docs/specifications/proof/paso-proof-verify.md`
  - Expected: `0`
- [ ] **Edit.** In the "Ad-hoc metadata:" bullet, replace "of the signed credential metadata JWT identified by `metadata_integrity`, and that the `metadata` object conforms" with:

  > of the signed credential metadata JWT identified by `metadata_integrity`, that the entry's `type` is not listed in `transaction_data_types` of that JWT, and that the `metadata` object conforms

- [ ] **GREEN**
  - Run the same grep. Expected: `1`.
  - Then run the strict build. Expected: exit 0.
- [ ] **Commit:** `docs: verify checks that ad-hoc metadata targets an unpublished type`

### Task 4: Core §5.5, Relying Party bullet

**Files:** Modify `docs/specifications/paso-core.md` §5.5.

- [ ] **RED**
  - Run: `grep -c "Where it supplies ad-hoc metadata" docs/specifications/paso-core.md`
  - Expected: `0`
- [ ] **Edit.** After "it **SHALL** construct the `payload` per that metadata." in the Relying Party bullet, append:

  > Where it supplies ad-hoc metadata ([PaSO Proof Metadata] Section 5) for a type that has a rulebook, it **SHALL** ensure that the metadata is consistent with the rulebook, as the Attestation Provider must for the metadata it publishes.

- [ ] **GREEN**
  - Run the same grep. Expected: `1`.
  - Then run the strict build. Expected: exit 0.
- [ ] **Commit:** `docs: core obliges relying parties to keep ad-hoc metadata consistent with the rulebook`

### Task 5: Review doc

**Files:** Modify `superpowers/specs/2026-11-24-spec-review.md` header.

- [ ] **RED**
  - Run: `f=superpowers/specs/2026-11-24-spec-review.md; grep -c "#9 — ad-hoc metadata only for" $f; grep -c "^\*\*Input for #9" $f; grep -c "Next up:\*\* #10" $f`
  - Expected: `0`, `1`, `0`
- [ ] **Resolved line.** Append: "#9 — ad-hoc metadata only for types the signed metadata does not list, enforced by the Wallet and checked by the Authorizing Party; RPs keep ad-hoc metadata consistent with any rulebook (design `2026-11-25-paso-adhoc-unpublished-only-design.md`, commits `<first>`..`<last>` of Tasks 1–4)."
- [ ] **Next up line.** Replace "#9 — ad-hoc metadata replaces the signed risk configuration (Risk §4.1, final paragraph)." with "#10 — the Verify §4.3 envelope is under-specified (JWS-in-JWE nesting, the header carrying `x5c`, RP authentication for `401`)." Keep the deferred-minors list.
- [ ] **Delete** the `**Input for #9:**` line.
- [ ] **GREEN**
  - Run the RED greps. Expected: `1`, `0`, `1`.
- [ ] **Commit:** `docs: mark spec review finding #9 resolved`

### Task 6: Branch check

- [ ] Run: `git diff --stat <plan commit>..HEAD -- docs/`
  - Expected: only `paso-proof-metadata.md`, `paso-proof-risk-signals.md`, `paso-proof-verify.md`, `paso-core.md`.
- [ ] Run: `rg -n -i "in place of|takes precedence|instead of relying|object instead" docs/specifications | rg -i "ad-hoc|metadata"`
  - Expected: exactly three lines, all static-rendering uses that stay: `paso-view.md` (§5.3, "in place of the `display` entries"), and `paso-proof-metadata.md` §3.1 and §3.2 ("uses its own labels in place of"). Baseline before Task 1: seven lines.
- [ ] Run the strict build. Expected: exit 0.
