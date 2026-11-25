# Consistent Consequences of Processing Failures — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Core §7.5 states three failure levels (request, credential, entry). The four outliers become entry-level, so the versioned fallback works for locale and encryption-key failures.

**Architecture:** Documentation-only. One commit per document.

**Tech Stack:** Markdown, MkDocs Material.

**Spec:** `superpowers/specs/2026-11-25-paso-failure-levels-design.md`

## Global Constraints

- No renumbering.
- Only `paso-core.md`, `paso-view.md`, `paso-proof-metadata.md` and `paso-proof-risk-signals.md` change under `docs/`.
- The wording for entry-level is "not compatible with the credential". It points to Core Section 7.5.
- Duplicate member names and Metadata §7's credential exclusion stay unchanged.
- After every task, `.venv/bin/mkdocs build --strict -d /tmp/paso-site` exits 0.

## Review Focus

- **Versioned fallback (Core A.7)** with a locale failure on the newer entry must now fall back to the older entry. View §4 step 3 + Core §7.5 Entry bullet.
- **Simple profile:** an entry-level failure still ends in "cease and inform" through §7.3 step 2, because there is only one entry.
- **Defaults-only selection** must not become a failure anywhere (View §4, Metadata §5.4).
- **Risk §7.3** must still forbid plaintext signals when no key is available. Only the consequence sentence changes.
- **No remaining credential-level wording** outside Metadata §7. Task 6 greps for "exclude the credential" and "exclude a credential".

---

### Task 1: Core §7.2 and §7.5

**Files:** Modify `docs/specifications/paso-core.md`.

- [ ] **RED**
  - Run: `f=docs/specifications/paso-core.md; for p in 'if not every array has a default entry' 'Failures during transaction data processing have one of three consequences'; do printf '%s ' "$(grep -cF "$p" $f)"; done; echo`
  - Expected: `0 0`
- [ ] **§7.2.** Replace "If no locale in its priority list matches, it renders all of them from the default entries (entries without a `locale`)." with:

  > If no locale in its priority list matches, it renders all of them from the default entries (entries without a `locale`); if not every array has a default entry, the entry is not compatible with the credential ([PaSO View] Section 4).

- [ ] **§7.5.** After "Other PaSO specifications define further conditions under which an entry is not compatible with a credential.", insert a new paragraph:

  > Failures during transaction data processing have one of three consequences:
  >
  > - **Request.** Where the presentation request itself is malformed or untrusted, whatever the credential, the Wallet rejects it: an unsigned request (Section 3), a request in a profile the Wallet does not support (Section 7.4), alternatives that are not transposable or do not form a single PaSO slot (Section 7.4.1), and duplicate member names (above).
  > - **Credential.** Where the credential itself cannot be used, the Wallet excludes it from further processing: its signed credential metadata JWT is invalid ([PaSO Proof Metadata] Section 7).
  > - **Entry.** Every other failure in processing a `transaction_data` entry for a credential, in this or any other PaSO specification, makes the entry not compatible with that credential. What follows is decided by Section 7.3 step 2 in the simple profile and by Section 7.4.2 steps 2 to 4 in the advanced profile.

- [ ] **GREEN**
  - Run the RED loop. Expected: `1 1`.
  - Then run the strict build. Expected: exit 0.
- [ ] **Commit:** `docs: core states the three levels of processing failure`

### Task 2: View §4 and A.1

**Files:** Modify `docs/specifications/paso-view.md`.

- [ ] **RED**
  - Run: `f=docs/specifications/paso-view.md; for p in 'exclude the credential from further processing' 'SHALL NOT** exclude a credential' 'would exclude the credential' 'not compatible with the credential ([PaSO Core] Section 7.5)' 'would not be compatible with the credential'; do printf '%s ' "$(grep -cF "$p" $f)"; done; echo`
  - Expected: `1 1 1 0 0`
- [ ] **§4 step 3.** "3. Otherwise, the Wallet **SHALL** exclude the credential from further processing." → "3. Otherwise, the `transaction_data` entry is not compatible with the credential ([PaSO Core] Section 7.5)."
- [ ] **§4.** "The Wallet **SHALL NOT** exclude a credential, or treat a `transaction_data` entry as not compatible, solely because the default entries were selected." → "The Wallet **SHALL NOT** treat a `transaction_data` entry as not compatible solely because the default entries were selected."
- [ ] **A.1.** "and the Wallet would exclude the credential." → "and the `transaction_data` entry would not be compatible with the credential."
- [ ] **GREEN**
  - Run the RED loop. Expected: `0 0 0 1 1`.
  - Then run the strict build. Expected: exit 0.
- [ ] **Commit:** `docs: view makes locale selection failure entry-level`

### Task 3: Metadata §5.4

**Files:** Modify `docs/specifications/proof/paso-proof-metadata.md` §5.4.

- [ ] **RED**
  - Run: `f=docs/specifications/proof/paso-proof-metadata.md; grep -cF 'the Wallet **MAY** treat the `transaction_data` entry as incompatible' $f; grep -cF 'applies to ad-hoc metadata as to any other metadata' $f`
  - Expected: `1`, `0`
- [ ] **Edit.** Replace the paragraph "If locale selection per [PaSO View] Section 4 does not succeed for the ad-hoc metadata … **SHALL NOT** be treated as incompatible on locale grounds." with:

  > Locale selection per [PaSO View] Section 4 applies to ad-hoc metadata as to any other metadata. If it does not succeed, the `transaction_data` entry is not compatible with the targeted credential ([PaSO Core] Section 7.5). If it succeeds only through default entries, the entry **SHALL NOT** be treated as incompatible on locale grounds.

- [ ] **GREEN**
  - Run the RED greps. Expected: `0`, `1`.
  - Then run the strict build. Expected: exit 0.
- [ ] **Commit:** `docs: metadata makes ad-hoc locale failure entry-level`

### Task 4: Risk Signals §7.3

**Files:** Modify `docs/specifications/proof/paso-proof-risk-signals.md` §7.3.

- [ ] **RED**
  - Run: `f=docs/specifications/proof/paso-proof-risk-signals.md; grep -cF 'cease processing it, and inform the user' $f; grep -cF 'is then not compatible with the credential' $f; grep -cF 'SHALL NOT** send the risk signals in plaintext' $f`
  - Expected: `1`, `0`, `1`
- [ ] **Edit.** Replace "The Wallet **SHALL** treat the `transaction_data` entry as incompatible, cease processing it, and inform the user." with "The `transaction_data` entry is then not compatible with the credential ([PaSO Core] Section 7.5)."
- [ ] **GREEN**
  - Run the RED greps. Expected: `0`, `1`, `1`.
  - Then run the strict build. Expected: exit 0.
- [ ] **Commit:** `docs: risk signals make a missing encryption key entry-level`

### Task 5: Review doc

**Files:** Modify `superpowers/specs/2026-11-24-spec-review.md` header.

- [ ] **RED**
  - Run: `f=superpowers/specs/2026-11-24-spec-review.md; for p in '#13 — one model of failure levels' 'Next up:** #14' '#13 done (commits'; do printf '%s ' "$(grep -cF "$p" $f)"; done; echo`
  - Expected: `0 0 0`
- [ ] **Resolved line.** After "(design `2026-11-25-paso-single-paso-slot-design.md`, commits `079520e`..`75576c6`)." append:

  > #13 — one model of failure levels in Core §7.5 (request, credential, entry; entry by default); View §4 locale failure, Metadata §5.4 ad-hoc locale failure and Risk §7.3 missing key are now entry-level, so the versioned fallback applies; Core §7.2 covers the no-defaults case (design `2026-11-25-paso-failure-levels-design.md`, commits `<first>`..`<last>` of Tasks 1–4).

- [ ] **Next up.** Replace the "#13 — what gets excluded on failure is inconsistent (…)." sentence with:

  > #14 — display order (View §2 says it follows the `claims` array; the wildcard rule renders all non-wildcard claims first, moving a claim declared after an array group ahead of it).

- [ ] **Handoff.** "#12 done (commits `079520e`..`75576c6`)." → "#13 done (commits `<first>`..`<last>`)."
- [ ] **GREEN**
  - Run the RED loop. Expected: `1 1 1`.
- [ ] **Commit:** `docs: mark spec review finding #13 resolved`

### Task 6: Branch check

- [ ] Run: `git diff --stat <plan commit>..HEAD -- docs/`
  - Expected: only the four spec files named in Global Constraints.
- [ ] Run: `rg -n -i 'exclude the credential|exclude a credential' docs/specifications`
  - Expected: one line, Metadata §7 (invalid metadata JWT), and the Core §7.5 Credential bullet does not use that wording.
- [ ] Run: `rg -n 'cease processing it' docs`
  - Expected: no output.
- [ ] Run the strict build. Expected: exit 0.