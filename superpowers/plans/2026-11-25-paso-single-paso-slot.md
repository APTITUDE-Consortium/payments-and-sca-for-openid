# At Most One PaSO Credential per Presentation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A presentation request lets the user present exactly one PaSO Credential. Core closes every DCQL route to more, View and Verify follow, and `∅` is defined.

**Architecture:** Documentation-only. One commit per document.

**Tech Stack:** Markdown, MkDocs Material.

**Spec:** `superpowers/specs/2026-11-25-paso-single-paso-slot-design.md`

## Global Constraints

- No renumbering. New text goes into existing sections.
- Only `paso-core.md`, `paso-view.md` and `paso-proof-verify.md` change under `docs/`.
- OID4VP references: Section 6.1 (`multiple`) and Section 6.2 (`required`).
- The term is "PaSO slot", defined once, in Core §7.4.1.
- After every task, `.venv/bin/mkdocs build --strict -d /tmp/paso-site` exits 0.

## Review Focus

- **Versioned fallback (A.7)** must stay valid. Several entries targeting the *same* credential query are still one PaSO slot. Task 1's wording counts credential query identifiers, not entries.
- **A.5** must still conform. Its PaSO set has options `[sca_card, pid]`, `[sca_card]`, `[sca_account, pid]`, `[sca_account]`: exactly one PaSO identifier each, and `required` defaults to `true`.
- **Simple-profile `multiple: true`** must be rejected. It falls out of §7.3 into §7.4, where the §7.4.1 rule rejects it, and a simple-only Wallet rejects any §7.4 request anyway.
- **Non-PaSO optional slots** (PID) are unaffected. The new rule speaks only of PaSO-referenced identifiers.
- **Verify** must reject zero or several PaSO presentations, not only several.

---

### Task 1: Core §7.3, §7.4.1, §7.4.2, A.5

**Files:** Modify `docs/specifications/paso-core.md`.

- [ ] **RED**
  - Run: `f=docs/specifications/paso-core.md; for p in 'SHALL NOT** set `multiple` to `true`' 'the **PaSO slot**' 'A slot contains ∅ when' 'from the PaSO slot (Section 7.4.1)' '_S₁_ is the PaSO slot' 'apply to the selected credential.' 'have `required` set to `false`'; do printf '%s ' "$(grep -cF "$p" $f)"; done; echo`
  - Expected: `0 0 0 0 0 1 0`
- [ ] **§7.3.** Replace "whose `credential_ids` **SHALL** contain exactly one credential query identifier." with:

  > whose `credential_ids` **SHALL** contain exactly one credential query identifier; that credential query **SHALL NOT** set `multiple` to `true` ([OID4VP] Section 6.1).

- [ ] **§7.4.1, ∅.** After "Each slot contains the credentials the user can pick for that choice, and may also allow the user to pick nothing (making that slot optional)." append: " A slot contains ∅ when some alternatives contain none of its credential query identifiers."
- [ ] **§7.4.1, rule.** After the paragraph "Alternatives that do not involve any PaSO-targeted `transaction_data` entry are not subject to this requirement.", insert:

  > A presentation request **SHALL** allow exactly one PaSO Credential to be presented:
  >
  > - When `credential_sets` are used, every alternative of the credential set that contains the credential query identifiers referenced by PaSO-targeted `transaction_data` entries **SHALL** contain exactly one of those identifiers, and that credential set **SHALL NOT** have `required` set to `false` ([OID4VP] Section 6.2).
  > - When `credential_sets` are not used, the PaSO-targeted `transaction_data` entries **SHALL** together reference exactly one credential query identifier.
  > - A credential query referenced by a PaSO-targeted `transaction_data` entry **SHALL NOT** set `multiple` to `true` ([OID4VP] Section 6.1).
  >
  > The credential query identifiers referenced by PaSO-targeted `transaction_data` entries therefore form a single slot without ∅: the **PaSO slot**. If a Wallet detects that a presentation request does not meet these conditions, it **SHALL** stop processing and inform the user.

- [ ] **§7.4.2.** Replace "After resolution, exactly one `transaction_data` entry **SHALL** apply to the selected credential." with:

  > The user selects exactly one PaSO Credential, from the PaSO slot (Section 7.4.1). After resolution, exactly one `transaction_data` entry **SHALL** apply to that credential.

- [ ] **A.5.** After "The four alternatives decompose into _S₁_ = {`sca_card`, `sca_account`}, _S₂_ = {`pid`, ∅}." append: " _S₁_ is the PaSO slot (Section 7.4.1)."
- [ ] **GREEN**
  - Run the RED loop. Expected: `2 1 1 1 1 0 1`. (`multiple` appears in §7.3 and §7.4.1.)
  - Then run the strict build. Expected: exit 0.
- [ ] **Commit:** `docs: core allows exactly one PaSO credential per presentation`

### Task 2: View §5.2

**Files:** Modify `docs/specifications/paso-view.md` §5.2.

- [ ] **RED**
  - Run: `f=docs/specifications/paso-view.md; grep -cF 'In the advanced profile ([PaSO Core] Section 7.4), the mode applies' $f; grep -cF 'differ between the candidate credentials' $f`
  - Expected: `1`, `0`
- [ ] **Edit.** Replace "In the advanced profile ([PaSO Core] Section 7.4), the mode applies to the entry presented for each credential and **MAY** differ between credentials." with:

  > The mode applies to the entry presented with the selected PaSO Credential and **MAY** differ between the candidate credentials the user can choose from ([PaSO Core] Sections 7.3 and 7.4).

- [ ] **GREEN**
  - Run the RED greps. Expected: `0`, `1`.
  - Then run the strict build. Expected: exit 0.
- [ ] **Commit:** `docs: view reports render_mode for the selected PaSO credential in both profiles`

### Task 3: Verify §3 intro

**Files:** Modify `docs/specifications/proof/paso-proof-verify.md` §3.

- [ ] **RED**
  - Run: `f=docs/specifications/proof/paso-proof-verify.md; grep -cF 'Steps 2 to 6 apply to each PaSO presentation' $f; grep -cF 'contains no such presentation, or more than one' $f`
  - Expected: `1`, `0`
- [ ] **Edit.** Replace "Steps 2 to 6 apply to each PaSO presentation, that is, each presentation in the `vp_token`" with "Steps 2 to 6 apply to the PaSO presentation, that is, the presentation in the `vp_token`". Then after "…of a PaSO-targeted `transaction_data` entry ([PaSO Core] Section 7.3)." append:

  > If the `vp_token` contains no such presentation, or more than one, the check fails ([PaSO Core] Section 7.4.1).

- [ ] **GREEN**
  - Run the RED greps. Expected: `0`, `1`.
  - Then run the strict build. Expected: exit 0.
- [ ] **Commit:** `docs: verify expects exactly one PaSO presentation`

### Task 4: Review doc

**Files:** Modify `superpowers/specs/2026-11-24-spec-review.md` header.

- [ ] **RED**
  - Run: `f=superpowers/specs/2026-11-24-spec-review.md; for p in '#12 — a presentation carries exactly one PaSO Credential' 'Next up:** #13' 'View §5.2 limits per-credential' 'From #11: Verify does not stop' '#12 done (commits'; do printf '%s ' "$(grep -cF "$p" $f)"; done; echo`
  - Expected: `0 0 1 1 0`
- [ ] **Resolved line.** After "(design `2026-11-25-paso-entry-hash-design.md`, commits `4de3d48`..`e9168dc`)." append:

  > #12 — a presentation carries exactly one PaSO Credential (the PaSO slot: one PaSO identifier per alternative, set not optional, no `multiple`); `∅` defined; View §5.2 and Verify §3 follow (design `2026-11-25-paso-single-paso-slot-design.md`, commits `<first>`..`<last>` of Tasks 1–3).

- [ ] **Next up.** Replace the "#12 — two different selection models (…)." sentence with:

  > #13 — what gets excluded on failure is inconsistent (View §4 step 3 excludes the credential, Metadata §5.4 MAY treat the entry as incompatible, Core §7.4.2 step 2 rejects the request, Risk §7.3 ceases processing; Core §7.2 omits the no-default-entries case).

- [ ] **Deferred minors.**
  - Delete "; View §5.2 limits per-credential `render_mode` differences to the advanced profile". Keep the period that follows.
  - Delete the sentence " From #11: Verify does not stop … take up with #12)."
- [ ] **Handoff.** "#11 done (commits `4de3d48`..`e9168dc`)." → "#12 done (commits `<first>`..`<last>`)."
- [ ] **GREEN**
  - Run the RED loop. Expected: `1 1 0 0 1`.
- [ ] **Commit:** `docs: mark spec review finding #12 resolved`

### Task 5: Branch check

- [ ] Run: `git diff --stat <plan commit>..HEAD -- docs/`
  - Expected: only `paso-core.md`, `paso-view.md` and `paso-proof-verify.md`.
- [ ] Run: `grep -o 'PaSO slot' docs/specifications/paso-core.md | wc -l; grep -c '\*\*PaSO slot\*\*' docs/specifications/paso-core.md`
  - Expected: `3`, then `1`. The three uses are the definition ("…single slot without ∅: the **PaSO slot**"), §7.4.2 and A.5. The term is absent before Task 1.
- [ ] Run: `rg -n 'each PaSO presentation' docs`
  - Expected: no output.
- [ ] Run the strict build. Expected: exit 0.