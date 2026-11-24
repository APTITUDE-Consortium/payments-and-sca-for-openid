# The Advanced Profile Is Optional — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the advanced profile optional everywhere. Give the simple profile an exact boundary. Factor entry compatibility out into a shared Core §7.5.

**Architecture:** Documentation-only. Core first, then the documents that reference it. One commit per document.

**Tech Stack:** Markdown, MkDocs Material.

**Spec:** `superpowers/specs/2026-11-24-paso-optional-advanced-profile-design.md`

## Global Constraints

- No renumbering of existing Core sections. The new section is §7.5.
- Advanced-profile semantics are unchanged: transposability, slots and first-match.
- After every task, `.venv/bin/mkdocs build --strict -d /tmp/paso-site` exits 0.

## Review Focus

- **The "resume with the next entry" fallback** of §7.4.2 must survive moving the resolution rule into §7.5. Without it, the versioned fallback in Annex A.7 breaks.
- **The simple-profile boundary.** A request that adds an optional PID via `credential_sets` alongside a required PaSO credential must stay in the simple profile (Annex A.6's transposable example is advanced only because of the PID choice; check that the wording doesn't misclassify it).
- **The duplicate-member-names rule** must keep its current effect, rejecting the request, wherever it moves.

---

### Task 1: Core §7.3, §7.4 and new §7.5

**Files:** Modify `docs/specifications/paso-core.md` §7.3, §7.4, §7.4.2; add §7.5 before "## 8 References".

- [ ] **RED**
  - Run: `grep -c "non-trivial" docs/specifications/paso-core.md; grep -c "^### 7.5" docs/specifications/paso-core.md`
  - Expected: `2` then `0`
- [ ] **§7.5 "Entry Compatibility".**
  - It defines that a PaSO-targeted entry is *compatible* with a credential when all of the following hold:
    1. the credential matches a credential query listed in the entry's `credential_ids`;
    2. the entry's `type` is among the transaction data types the credential supports;
    3. the `payload` conforms, using the conformance sentence moved verbatim from §7.4.2 step 2 ("A `payload` conforms if…");
    4. every claim requiring an external resource with integrity verification has been resolved and verified.
  - Move, verbatim, the duplicate-member-names sentence ("A Wallet **SHALL** reject a request whose…").
  - Add: "Other PaSO specifications define further conditions under which an entry is not compatible."
- [ ] **§7.3.** Replace the boundary paragraph with:
  - exactly one PaSO-targeted entry;
  - its `credential_ids` contains exactly one credential query identifier;
  - when `credential_sets` are used, that identifier **SHALL** appear in every option of every credential set that references it, and at least one such set **SHALL** be required.

  Delete "The Wallet **MAY** reject non-trivial credential set configurations." Replace the steps with:
  1. Identify the credentials in the Wallet that match the credential query.
  2. Retain those with which the entry is compatible per Section 7.5. If none remain, the Wallet **SHALL** cease processing and inform the user.
  3. If more than one credential remains, the Wallet **SHALL** let the user select one. It **SHALL** display the transaction data as rendered with the selected credential's metadata, and **SHALL** update the display when the selection changes.
  4. Display the transaction data to the user for consent. If the user consents, proceed with the presentation.
- [ ] **§7.4 intro.**
  - The advanced profile applies "when a presentation request contains a PaSO-targeted `transaction_data` entry and does not meet the conditions of the simple profile (Section 7.3)".
  - The rejection sentence becomes: a Wallet that does not support the advanced profile **SHALL** reject such a request and **SHALL** inform the user.
- [ ] **§7.4.2.**
  - Step 2: "select the first PaSO-targeted entry (in array order) that targets that credential via `credential_ids` and is compatible with it per Section 7.5, evaluating the conditions of Section 7.5 in order." Remove the inline conformance definition and the duplicate-names sentence (both moved to §7.5). Keep "If no entry is compatible, the credential **SHALL** be excluded."
  - Step 3 becomes: "Where resolution or verification of an external resource (Section 7.5, condition 4) fails for the selected entry, the Wallet **SHALL** resume the selection in step 2 with the next `transaction_data` entry in array order that targets that credential. If no compatible entry remains, the credential **SHALL** be excluded."
- [ ] **GREEN**
  - Run: `grep -c "non-trivial" docs/specifications/paso-core.md; grep -c "^### 7.5" docs/specifications/paso-core.md; grep -c "A \`payload\` conforms if" docs/specifications/paso-core.md`
  - Expected: `0`, `1`, `1`
  - Then run the strict build. Expected: exit 0.
- [ ] **Commit:** `docs: core makes the advanced profile optional and shares entry compatibility rules`

### Task 2: View §1.1

**Files:** Modify `docs/specifications/paso-view.md` §1.1.

- [ ] **RED**
  - Run: `grep -c "SHALL\*\* support the advanced profile" docs/specifications/paso-view.md`
  - Expected: `1`
- [ ] **Edit.** Replace the paragraph with:

  > PaSO View applies to both the simple and the advanced profile defined in [PaSO Core] Section 7. Whenever the user's credential selection changes which credential or `transaction_data` entry applies, the Wallet renders the transaction data anew per this document.
- [ ] **GREEN**
  - Run the same grep. Expected: `0`.
  - Then run the strict build. Expected: exit 0.
- [ ] **Commit:** `docs: view applies to both profiles and no longer requires the advanced profile`

### Task 3: Metadata §5.3 reference

**Files:** Modify `docs/specifications/proof/paso-proof-metadata.md` §5.3.

- [ ] **RED**
  - Run: `grep -c "\[PaSO Core\] Section 7.4.2" docs/specifications/proof/paso-proof-metadata.md`
  - Expected: `1`
- [ ] **Edit.** Change `[PaSO Core] Section 7.4.2` to `[PaSO Core] Section 7.5`.
- [ ] **GREEN**
  - Run the same grep. Expected: `0`.
  - Then run the strict build. Expected: exit 0.
- [ ] **Commit:** `docs: metadata refers to core entry compatibility`

### Task 4: Intro §5

**Files:** Modify `docs/index.md` §5 ("The advanced profile handles choice").

- [ ] **RED**
  - Run: `grep -c "optional advanced profile" docs/index.md`
  - Expected: `0`
- [ ] **Edit.** Change the bullet lead to "**The optional advanced profile handles choice.**". After it, add the sentence: "Wallets that implement only the simple profile handle a single transaction-data entry for a single requested credential, while still letting the user pick among several matching credentials."
- [ ] **GREEN**
  - Run the same grep. Expected: `1`.
  - Then run the strict build. Expected: exit 0.
- [ ] **Commit:** `docs: intro marks the advanced profile as optional`