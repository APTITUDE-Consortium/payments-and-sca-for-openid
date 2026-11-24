# PaSO Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the `template:` and `mini_markdown` value types, the Generic and Mandate rulebooks, and all SVG support from the PaSO spec set, moving "Metadata Source Priority" into the Metadata module.

**Architecture:** Markdown spec edits on `draft-3`, one commit per task. The "tests" are grep checks for leftover references plus the strict MkDocs build, which fails on broken links.

**Tech Stack:** MkDocs Material via `uvx` (`make build` runs `mkdocs build --strict`).

**Spec:** `superpowers/specs/2026-11-24-paso-simplification-design.md`

## Global Constraints

- Baseline: `make build` exits 0 on `draft-3` at `02c7a6f`. Every task must leave it at exit 0. Run `rm -rf site` afterwards.
- Keep the spec style: RFC 2119 keywords in `**BOLD**`, `[Reference]` names resolved in each file's references table.
- No editorial changes beyond what the removals require.
- Keep these on purpose: the "Generic Rendering" heading in `paso-view.md` §2, "generic"/"generically" wording about rendering, and "mandate(s)" or "mandatory" used as ordinary words.
- Do not renumber sections that other files cite. The only renumbering allowed is Metadata "9 References" becoming "10 References".

## Review Focus

1. **Orphaned section citations.** Every `[PaSO Proof SD-JWT-VC and SVG] Section N` must be retargeted or removed. One of them is `paso-proof-risk-signals.md:230`, which must point at `[PaSO Proof Metadata] Section 9`. Checked by the Task 3 grep.
2. **Leftover label-formatting rules.** `security_hint` "MUST NOT include a `value_type`" (Metadata lines 79 and 107) must not survive as a rule about a parameter that no longer exists. Checked by the Task 1 grep on `ui_labels` + `value_type`.
3. **Locale-selection exclusion of `display_type`** (`paso-view.md` §3 last paragraph, and any mention in §4 or in `paso-proof-verify.md`). It must go entirely. Checked by the Task 1 grep across `docs/`.
4. **SVG mentioned as "resolved resources" in the Log module** (lines 23 and 37). The sentence must still read correctly once the SVG items are dropped. Checked by the Task 3 grep plus a re-read.
5. **The `index.md` "no wallet update for new types" story** must still be true and must name ad-hoc metadata. Checked by a Task 4 re-read against Metadata §5.

---

### Task 1: Remove the `template:` and `mini_markdown` value types; labels become plain text

**Files:**
- Modify: `docs/specifications/paso-view.md` (§2 line 31, §3 line 54, table rows `mini_markdown` around lines 125–135 and `template:${value_type}` around lines 150–172)
- Modify: `docs/specifications/proof/paso-proof-metadata.md` (lines 59–60, 72, 79, 107, 116)
- Modify: `docs/index.md` line 131 (drop "lightweight inline-formatted text" and "a template that interpolates…" from the value-type examples)

**Interfaces:**
- Produces: the labels rule "labels are plain text; no formatting parameter on `display` or `ui_labels` entries". Task 3 does not touch these lines.

- [ ] **Step 1: Run the leftover check and confirm it finds hits**

Run: `grep -rnE 'mini_markdown|template:|display_type|inline-formatted' docs`
Expected: hits in `paso-view.md`, `paso-proof-metadata.md`, `Mandate.md` and `index.md`. `Mandate.md` is removed in Task 2.

- [ ] **Step 2: Edit `paso-view.md`**
  - §2: delete the clause "; for labels produced with a `template:` prefix, the verification applies to the fully interpolated result".
  - §3: replace the `display_type` paragraph (line 54) with: "Labels — the `name` of a claim's `display` entry and the `value` of a `ui_labels` entry — are plain text. Value types apply to claim values only and **MUST NOT** be applied to labels."
  - Delete the `mini_markdown` and `template:${value_type}` table rows.
  - Remove `[CommonMark]` from the references table if nothing cites it any longer.

- [ ] **Step 3: Edit `paso-proof-metadata.md`**
  - Delete the `display_type` bullet (line 59).
  - Reduce line 60 to "The `name` of each `display` entry is subject to the label constraints defined in Section 3.3."
  - Delete the `ui_labels` `value_type` bullet (line 72).
  - In line 79, delete "Its entries **MUST NOT** include a `value_type`; the value is always plain text (Section 3.3)."
  - Replace line 107 with: "Labels are plain text. `display` entries and `ui_labels` entries carry no formatting parameter; claim value types — in particular `image`, `url`, and `label_only` — **MUST NOT** be applied to labels."
  - In line 116, delete the first sentence, "For labels whose … fully interpolated result."

- [ ] **Step 4: Edit `index.md` line 131** to remove the two value-type examples.

- [ ] **Step 5: Verify**

Run: `grep -rnE 'mini_markdown|template:|display_type|inline-formatted' docs --exclude=Mandate.md`
Expected: no output.

Run: `grep -nE 'ui_labels.*value_type|value_type.*ui_labels' docs/specifications/proof/paso-proof-metadata.md`
Expected: no output.

Run: `make build; rm -rf site`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add docs/specifications/paso-view.md docs/specifications/proof/paso-proof-metadata.md docs/index.md
git commit -m "docs: remove template and mini_markdown value types; labels are plain text"
```

### Task 2: Remove the Generic and Mandate rulebooks

**Files:**
- Delete: `docs/rulebooks/transaction_data/Generic.md`, `docs/rulebooks/transaction_data/Mandate.md`
- Modify: `README.md` line 17, which becomes `rulebooks/transaction_data/  # Payment rulebook`

- [ ] **Step 1: Delete both files with `git rm`.**

- [ ] **Step 2: Fix `README.md` line 17.**

- [ ] **Step 3: Verify**

Run: `grep -rniE 'Generic\.md|Mandate\.md|\[Generic\]|\[Mandate\]|generic:[0-9<]|emandate|Basic Mandates' docs README.md`
Expected: no output.

Run: `make build; rm -rf site`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add -A docs/rulebooks README.md
git commit -m "docs: remove Generic and Mandate rulebooks"
```

### Task 3: Move Metadata Source Priority into Metadata; remove SVG support

**Files:**
- Modify: `docs/specifications/proof/paso-proof-metadata.md`. Insert the new "## 9 SD-JWT-VC Type Metadata" before the current "## 9 References" (line 248), which becomes "## 10 References". `[OID4VCI]` and `[SD-JWT-VC]` are already in its references table.
- Delete: `docs/specifications/proof/paso-proof-sd-jwt-vc-svg.md`
- Modify: `docs/specifications/paso-view.md` (image row, lines 81, 83 and 85; references row at line 223)
- Modify: `docs/specifications/proof/paso-proof-risk-signals.md` (line 230 citation; references row at line 288)
- Modify: `docs/specifications/proof/paso-proof-log.md` (lines 23 and 37; references row at line 59)
- Modify: `docs/index.md` line 45 (remove the SD-JWT-VC/SVG module from the PaSO Proof module list)

**Interfaces:**
- Produces: `[PaSO Proof Metadata] Section 9` ("SD-JWT-VC Type Metadata"), cited by risk-signals line 230.

- [ ] **Step 1: Run the leftover check and confirm it finds hits**

Run: `grep -rniE 'svg' docs README.md`
Expected: hits in the files listed above.

- [ ] **Step 2: Insert the new section into `paso-proof-metadata.md`**, with this exact text:

```markdown
## 9 SD-JWT-VC Type Metadata

As an exception to Section 3, the Wallet **MAY** use integrity-verified [SD-JWT-VC] Type Metadata for display purposes without requiring a signed credential metadata JWT for the display information.

When displaying a PaSO Credential in [SD-JWT-VC] format, the Wallet **SHALL** resolve display metadata following the priority order defined in [OID4VCI] Section 12.2.4. [SD-JWT-VC] integrity verification is always required in a PaSO context; any resource that is not integrity-verified **SHALL** be considered absent.
```

Then renumber "## 9 References" to "## 10 References".

- [ ] **Step 3: Delete the SVG module with `git rm`.**

- [ ] **Step 4: Edit the `image` row in `paso-view.md`**
  - Line 81 becomes: "The image **MUST** be in PNG or JPEG format; an image in any other format makes the `transaction_data` entry not compatible. When resolving a URL, the Wallet **SHALL** send an `Accept` header listing `image/png` and `image/jpeg`."
  - Line 83: delete "If the resolved image is an SVG, … Section 3."
  - Line 85: delete the sentence beginning "The Wallet **SHALL** render SVG images statically".
  - Delete the `[PaSO Proof SD-JWT-VC and SVG]` references row.

- [ ] **Step 5: Edit `paso-proof-risk-signals.md`**
  - At line 230, change "[PaSO Proof SD-JWT-VC and SVG] Section 2" to "[PaSO Proof Metadata] Section 9".
  - Delete the references row at line 288. `[PaSO Proof Metadata]` must already be in the table; add it if it is missing.

- [ ] **Step 6: Edit `paso-proof-log.md`**
  - Lines 23 and 37: drop "SVG templates, resources embedded within SVG documents (per …)" from the resolved-resources lists, keeping each sentence grammatical.
  - Delete the references row at line 59.

- [ ] **Step 7: Edit `index.md` line 45.**

- [ ] **Step 8: Verify**

Run: `grep -rniE 'svg' docs README.md`
Expected: no output.

Run: `grep -rn 'Metadata\] Section 9' docs`
Expected: exactly one hit, in `paso-proof-risk-signals.md`.

Run: `make build; rm -rf site`
Expected: exit 0.

- [ ] **Step 9: Commit**

```bash
git add -A docs
git commit -m "docs: remove SVG support; move metadata source priority into the Metadata module"
```

### Task 4: Re-anchor the `index.md` generic-types story on ad-hoc metadata

**Files:**
- Modify: `docs/index.md` lines 155–185 ("renders the consent screen generically", "a new transaction data type can be introduced by the issuer publishing its metadata and rulebook", "Under the dynamic path…")

- [ ] **Step 1: Rewrite the passages.** Keep the claim that a new transaction type needs no wallet update. State that types without a published rulebook are supported through ad-hoc transaction data metadata: a Relying Party authorised in the signed credential metadata (`adhoc_metadata_clients`) supplies the type's metadata in the `transaction_data` entry, per [PaSO Proof Metadata] Section 5. Keep the existing tone and length; only change what now has to change.

- [ ] **Step 2: Verify**

Run: `grep -nE 'ad-hoc' docs/index.md`
Expected: at least one hit in lines 155–185.

Run: `grep -rniE 'mini_markdown|template:|display_type|svg|Generic\.md|Mandate\.md|\[Generic\]|\[Mandate\]|emandate|sd-jwt-vc-svg' docs README.md`
Expected: no output. This is the design doc's whole-branch check.

Run: `make build; rm -rf site`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add docs/index.md
git commit -m "docs: present generic transaction types via ad-hoc metadata in the overview"
```