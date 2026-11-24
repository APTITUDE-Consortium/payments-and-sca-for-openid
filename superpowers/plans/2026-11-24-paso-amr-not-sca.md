# `amr` Is a Risk Signal, Not the SCA Mechanism — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove every statement that equates the `amr` risk signal with Strong Customer Authentication. State that SCA comes from holder binding, as required by the Credential Rulebook.

**Architecture:** Documentation-only change across six Markdown files. There is one commit per document. Core is edited first, because the other documents defer to it.

**Tech Stack:** Markdown, MkDocs Material (`.venv/bin/mkdocs build --strict`).

**Spec:** `superpowers/specs/2026-11-24-paso-amr-not-sca-design.md`

## Global Constraints

- `amr` neither establishes nor negates SCA. No passage may say or imply otherwise.
- The `amr` value format, the RFC 8176 values and the `bio_strong`/`bio_weak` definitions are unchanged.
- The Default profile identifier stays `urn:paso:risk-profile:global:default:1`.
- Normative style: bold **SHALL**/**MUST**, and `[PaSO …]` cross-references, as in the surrounding text.
- After every task, `.venv/bin/mkdocs build --strict -d /tmp/paso-site` exits 0.

## Review Focus

- **Dangling references to Risk Signals §7.8.** After Task 3 deletes it, `grep -rn "7\.8" docs` must return nothing (checked in Task 6).
- **The signal count in `Default.md`.** "seven" appears in several places. All must become "eight" (checked in Task 5).
- **Encryption wording.** Risk Signals §6.1, A.5 and A.7 must still explain that encryption moves signal checks to the decryption-key holder, with nothing specific to `amr`.
- **SCA wording that does not use the token `amr`**, such as `index.md` §9.6 "the factor mix" and §4.1 "authentication methods". These must be caught by reading, not only by grep.

---

### Task 1: Core — SCA comes from holder binding

**Files:**
- Modify: `docs/specifications/paso-core.md` §4.2 (Credential Rulebook contents) and §6.1 (the paragraph after the claims table)

- [ ] **Step 1: Check that the old wording is present**
  - Run: `grep -c "evidences Strong Customer Authentication only where" docs/specifications/paso-core.md`
  - Expected: `1`
- [ ] **Step 2: §4.2.** After the bullet "issuance requirements (e.g., validity period, binding to wallet attestations)," add a bullet:
  - "holder binding and user authentication requirements: how the credential key is protected and which user authentication releases it,"
  - Below the list, before "Attestation Providers and Relying Parties **SHALL** follow…", add:

    > Strong Customer Authentication is established by holder binding: the credential key is held in the Wallet's secure cryptographic environment (possession) and released only after user authentication (knowledge or inherence). The Credential Rulebook of a PaSO Credential used for Strong Customer Authentication **SHALL** specify the holder binding and user authentication requirements by which its presentations meet [PSD2] Article 97.
- [ ] **Step 3: §6.1.** Replace the paragraph beginning "The authentication methods used to release the transaction, and the `response_mode`…" with:

  > The authentication methods used to release the transaction, and the `response_mode` of the Authorization Request, are not claims of this section. They are risk signal types defined by [PaSO Risk Signal Registry] and are carried inside `risk_signals` when the risk signal set in force requires them. Strong Customer Authentication is established by holder binding per Section 4.2. The authentication-methods signal is a Wallet observation like any other risk signal: its presence does not establish Strong Customer Authentication, and its absence does not negate it.
- [ ] **Step 4: Verify**
  - Run: `grep -c "evidences Strong Customer Authentication only where" docs/specifications/paso-core.md; .venv/bin/mkdocs build --strict -d /tmp/paso-site >/dev/null 2>&1; echo $?`
  - Expected: `0` then `0`
- [ ] **Step 5: Commit**
  - `git commit -am "docs: core establishes SCA through holder binding, not the amr signal"`

### Task 2: Registry — `amr` is a plain signal

**Files:**
- Modify: `docs/specifications/proof/paso-proof-risk-signal-registry.md` §2.8 and §3

- [ ] **Step 1:** In §2.8, delete the paragraph "When used in a [PSD2] context, the `value` array **SHALL** cover…".
- [ ] **Step 2:** In §2.8, delete the final paragraph "[PaSO Core] does not require this signal. An ecosystem that requires Strong Customer Authentication…".
- [ ] **Step 3:** In §3, delete the `[PSD2]` reference row.
- [ ] **Step 4: Verify**
  - Run: `grep -c "PSD2\|Strong Customer" docs/specifications/proof/paso-proof-risk-signal-registry.md`
  - Expected: `0`
  - Then run the strict build. Expected: exit 0.
- [ ] **Step 5: Commit**
  - `git commit -am "docs: registry defines amr as a plain risk signal"`

### Task 3: Risk Signals — remove the `amr` special case

**Files:**
- Modify: `docs/specifications/proof/paso-proof-risk-signals.md` §7.8, Annex A.5 and A.7

- [ ] **Step 1:** Delete §7.8 "Interaction with Authentication-Method Signals" entirely: the heading and both paragraphs.
- [ ] **Step 2:** In A.5, delete the sentence "Any `amr` signal in the effective set is inside this ciphertext. Where the Authorizing Party is not the issuer it cannot read it — see Section 7.8."
- [ ] **Step 3:** In A.7, replace the closing paragraph ("Because `amr` resolved as required…") with:

  > Neither profile sets `encrypted`, so the Authorizing Party verifies every resolved signal directly. Had either profile set `encrypted` to `true`, those checks would move to the holder of the issuer decryption key per Section 6.1.
- [ ] **Step 4: Verify**
  - Run: `grep -n "7\.8\|Strong Customer" docs/specifications/proof/paso-proof-risk-signals.md`
  - Expected: no output.
  - Then run the strict build. Expected: exit 0.
- [ ] **Step 5: Commit**
  - `git commit -am "docs: risk signals treat amr like any other signal under encryption"`

### Task 4: Verify — drop the `amr` check

**Files:**
- Modify: `docs/specifications/proof/paso-proof-verify.md` §3 step 6

- [ ] **Step 1:** Delete the bullet "When `urn:paso:risk:global:amr:1` is present, verify that the authentication methods it reports meet…".
- [ ] **Step 2:** In the encryption bullet, delete the final sentence "An Authorizing Party that is not the issuer therefore cannot perform the `amr` check — see [PaSO Risk Signals] Section 7.8."
- [ ] **Step 3: Verify**
  - Run: `grep -c "amr" docs/specifications/proof/paso-proof-verify.md`
  - Expected: `0`
  - Then run the strict build. Expected: exit 0.
- [ ] **Step 4: Commit**
  - `git commit -am "docs: verify no longer special-cases the amr signal"`

### Task 5: Default profile — include `amr`

**Files:**
- Modify: `docs/rulebooks/risk_profiles/Default.md`

- [ ] **Step 1: Intro.** Replace "It gathers every signal type defined in [PaSO Risk Signal Registry] except `urn:paso:risk:global:amr:1`, which is left to ecosystems that require Strong Customer Authentication to mandate for themselves." with "It gathers every signal type defined in [PaSO Risk Signal Registry]."
- [ ] **Step 2: §1 table.**
  - `description`: "Recommended starting bundle of PaSO risk signals."
  - `signals`: "The eight entries of Section 2."
- [ ] **Step 3: §2 table.** Append the row `` | `urn:paso:risk:global:amr:1` | `true` | `600` | ``. In the paragraph below it, change "all seven signals" to "all eight signals".
- [ ] **Step 4: §3 bullets.**
  - Change "Three of the seven signals" to "Three of the eight signals".
  - Add "authentication methods" to the list of signals with no permission prompt.
  - Delete the sentence "Because this profile excludes `urn:paso:risk:global:amr:1`, the caution in [PaSO Risk Signals] Section 7.8 … does not arise."
- [ ] **Step 5: Verify**
  - Run: `grep -n "seven\|7\.8\|excluding\|except" docs/rulebooks/risk_profiles/Default.md; grep -c "amr:1" docs/rulebooks/risk_profiles/Default.md`
  - Expected: no output from the first grep, then `1` (the new table row).
  - Then run the strict build. Expected: exit 0.
- [ ] **Step 6: Commit**
  - `git commit -am "docs: default risk profile includes the amr signal"`

### Task 6: Intro — align with the specs

**Files:**
- Modify: `docs/index.md` §4.1 (line ~101), the two flow diagrams (§7.1, §7.2), §9.1, §9.6 and the §9.7 table

- [ ] **Step 1: §4.1.** Replace the bullet "the authentication methods used (with explicit values…), required to span at least two independent factor categories in a payments context;" with:
  - "risk signals — Wallet observations such as location, call activity or the authentication methods used — when a risk signal profile requires them;"
- [ ] **Step 2: Diagrams.** In both "Produce holder binding proof (…, amr, jti)" lines and both "Verify proof … (…, amr, …)" lines, replace `amr` with `risk signals`.
- [ ] **Step 3: §9.1 "How PaSO helps".** Replace the two sentences starting "PaSO makes the factors that were actually used *explicit and evidenced*…" and "PaSO additionally distinguishes stronger from weaker biometrics…" with:

  > The applicable Credential Rulebook is where these requirements are fixed: PaSO Core requires the rulebook of a credential used for SCA to specify how the key is protected and which user authentication releases it. A Wallet may additionally report the authentication methods it used as a risk signal, but that report is an observation for the authorizing party's risk policy; the factors themselves are established by the credential's holder binding.
- [ ] **Step 4: §9.6.** Replace "the factor mix," with "the risk signals,".
- [ ] **Step 5: §9.7.** Change the "Two independent SCA factors" mechanism cell to:
  - "Device-bound key (possession) released by PIN/biometric (knowledge/inherence), with the requirements fixed by the Credential Rulebook"
- [ ] **Step 6: Verify**
  - Run: `grep -n "amr\|factor mix\|factor categories" docs/index.md; grep -rn "7\.8" docs`
  - Expected: no output from either grep.
  - Then run the strict build. Expected: exit 0.
- [ ] **Step 7: Commit**
  - `git commit -am "docs: intro presents holder binding, not amr, as the source of SCA"`