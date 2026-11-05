# No Locale Mixing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A consent screen renders from one locale tag or entirely from default entries, and `display_locale` reports that tag or `"default"`.

**Architecture:** Spec-only change across four normative documents, plus informative examples. The rule lands in three layers:

- An issuer constraint (PaSO Proof Metadata §3.3) makes all arrays share one locale set.
- A single selection pass runs over that set (PaSO View §4).
- An exact-match verification checks the result (PaSO Proof Verify).

**Tech Stack:** Markdown, mkdocs-material (`make build` = `mkdocs build --strict`), Python 3 checker script.

**Spec:** `superpowers/specs/2026-11-05-no-locale-mixing-design.md`

**Branch:** `feat/no-locale-mixing` (from `draft-2`)

## Global Constraints

- RFC 2119 keywords are bold, as in the surrounding text: `**SHALL**`, `**MUST**`, `**MAY**`.
- Cross-references use the existing reference keys `[PaSO View]`, `[PaSO Core]`, `[PaSO Proof Metadata]`, `[RFC4647]`, `[RFC5646]`. Add no new reference entries.
- The reported default value is exactly the string `default`.
- Locale tags are compared case-insensitively everywhere: metadata constraint, selection, and verification.
- Do not touch `site/` (gitignored build output) or anything under `docs/` not named in a task.

## Review Focus

1. **Tag case differs across arrays** (`de` in one array, `DE` in another). This must count as the same tag in the §3.3 constraint, in §4 selection, and in verification. Pinned by grep in Tasks 1–3 for "case-insensitively".
2. **An entry is excluded in one array only** (an unsupported `display_type`, or a discarded `template:` entry). The tag must become unavailable, and selection must move on to the next locale. It must never render that array from another locale. Pinned by the View Annex example in Task 4.
3. **Only some arrays carry a default entry.** The type must be treated as not supported (§3.3), not partially fall back. Pinned by the §3.3 text in Task 1.
4. **Claims without `display`, and types without `ui_labels`.** These must not count as arrays missing a tag. Pinned by the "considered arrays" sentence in Task 2 and by the checker in Task 4.
5. **Truncating Lookup** (`de-CH` against `{en, de}`). This must report `de`, never `de-CH`. Pinned by the walkthrough row in Task 4.

---

### Task 1: Metadata constraint and compatibility wording (PaSO Proof Metadata)

**Files:**
- Modify: `docs/specifications/proof/paso-proof-metadata.md` lines 66, 108, 132, 187

**Interfaces:**
- Produces: the term **default entry** (an entry without `locale`), and the §3.3 rule that every array carries the same tag set and either all or none carry a default entry. Tasks 2–4 rely on both.

- [ ] **Step 1: Replace the `locale` bullet (line 66) with:**

```markdown
- `locale`: **OPTIONAL**. A [RFC5646] language tag. An entry without `locale` is a default entry. The same applies to entries without `locale` in a claim's `display` array (Section 3.1). Default entries are used only when no locale in the Wallet's locale priority list matches, and then for every array at once, per [PaSO View] Section 4. Section 3.3 requires all arrays of a transaction data type to provide the same locales and either all or none of them to provide a default entry.
```

- [ ] **Step 2: Insert a new bullet directly after line 108**

Line 108 is the bullet starting "A `display` array, and each `ui_labels` entry array, **MUST NOT** contain two entries with the same `locale`". Keep it, and add after it:

```markdown
- Every claim `display` array and every `ui_labels` entry array of the entry **MUST** contain entries for the same set of `locale` values, compared case-insensitively, and **MUST** either all contain a default entry or all contain none. This ensures that the Wallet renders the consent screen from a single locale, or entirely from default entries, per [PaSO View] Section 4.
```

The existing last sentence of §3.3 already makes a violation "not supported by the credential". Do not repeat it.

- [ ] **Step 3: Replace line 132 with:**

```markdown
The Wallet **MAY** refuse issuance if locale selection per [PaSO View] Section 4 does not succeed for the returned metadata and its locale priority list. Metadata for which selection succeeds only through default entries is compatible and **SHALL NOT** be refused on locale grounds.
```

- [ ] **Step 4: Replace line 187 with:**

```markdown
If locale selection per [PaSO View] Section 4 does not succeed for the ad-hoc metadata and the Wallet's locale priority list, the Wallet **MAY** treat the `transaction_data` entry as incompatible. Ad-hoc metadata for which selection succeeds only through default entries is compatible and **SHALL NOT** be treated as incompatible on locale grounds.
```

- [ ] **Step 5: Verify**

Run: `grep -c "taking default entries into account\|compatible with any Wallet locale" docs/specifications/proof/paso-proof-metadata.md`. Expected: `0`.

Run: `grep -c "compared case-insensitively" docs/specifications/proof/paso-proof-metadata.md`. Expected: `1`.

Run: `make build`. Expected: exit 0, no WARNING lines.

- [ ] **Step 6: Commit**

```bash
git add docs/specifications/proof/paso-proof-metadata.md
git commit -m "spec(metadata): require one locale set per transaction data type"
```

---

### Task 2: Single-locale selection (PaSO View §3, §4)

**Files:**
- Modify: `docs/specifications/paso-view.md` line 164 (template fallback), lines 181–193 (§4 body)

**Interfaces:**
- Consumes: Task 1's default-entry term and §3.3 constraint.
- Produces: the selection procedure and the `display_locale` value rule. Task 3 references these as "[PaSO View] Section 4".

- [ ] **Step 1: Replace line 164 with:**

```markdown
A discarded entry is excluded from locale selection per Section 4. If it leaves an array without an entry for a tag, that tag is not available, and selection continues with the next locale in the priority list or with the default entries. If locale selection does not succeed as a result, the `transaction_data` entry is not compatible.
```

- [ ] **Step 2: Replace §4 from line 181 through line 193**

The replaced range runs from "The Wallet **SHALL** select a locale for the transaction as follows." through "The selected locale **SHALL** be reported in the `display_locale` …". Keep line 179 (the priority list) and line 195 (the "MAY switch its entire user interface" paragraph) unchanged.

Replacement:

```markdown
The Wallet **SHALL** render all `display` entries and `ui_labels` entries of a transaction either from a single locale or entirely from default entries (entries without a `locale`). It **SHALL NOT** combine entries of different locales, or locale-tagged and default entries, on one consent screen.

The arrays considered are the `display` arrays of all `claims` metadata objects that have one, together with all `ui_labels` entry arrays, for the matching transaction data type. Entries excluded under Section 3 do not take part in selection. These are entries whose `display_type` is not permitted or not supported, and `template:` entries discarded during interpolation. The available tags are the `locale` values for which every considered array has a non-excluded entry, compared case-insensitively.

The Wallet **SHALL** select the locale as follows:

1. For each locale in the priority list, in order, apply the Lookup matching scheme defined in [RFC4647] Section 3.4, using that locale as the language range and the available tags as the set of language tags to match against. On the first match, the matched tag is selected. The Wallet **SHALL** render every considered array from its entry with that tag and **SHALL NOT** continue.
2. If no locale in the priority list produced a match, and every considered array has a non-excluded default entry, the default entries are selected. The Wallet **SHALL** render every considered array from its default entry.
3. Otherwise, the Wallet **SHALL** exclude the credential from further processing.

A locale-tagged match for any locale in the priority list takes precedence over the default entries. The Wallet **SHALL NOT** exclude a credential, or treat a `transaction_data` entry as not compatible, solely because the default entries were selected.

The Wallet **SHALL** report the selection in the `display_locale` holder binding proof claim per [PaSO Core]. The reported value is the selected tag as it appears in the metadata `locale` values, or the string `default` if the default entries were selected. It is not the priority-list locale used as the language range.
```

- [ ] **Step 3: Verify**

Run: `grep -c "does not affect locale selection\|fall back to the next locale in its priority list" docs/specifications/paso-view.md`. Expected: `0`.

Run: `grep -c "SHALL NOT\*\* combine entries" docs/specifications/paso-view.md`. Expected: `1`.

Run: `make build`. Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add docs/specifications/paso-view.md
git commit -m "spec(view): select one locale or defaults for the whole consent screen"
```

---

### Task 3: Reporting and verification (PaSO Core, PaSO Proof Verify)

**Files:**
- Modify: `docs/specifications/paso-core.md` line 134 (§6.1 table, `display_locale` description cell only), line 173 (§7.2)
- Modify: `docs/specifications/proof/paso-proof-verify.md` line 46 (`display_locale` bullet)

**Interfaces:**
- Consumes: Task 2's §4 value rule.

- [ ] **Step 1: In `paso-core.md` line 134, replace only the description cell text**

Keep the `| \`display_locale\` |` and `| yes |` cells and the pipe structure. The new cell text:

```text
The locale of the entries shown to the user during consent, per [PaSO View] Section 4: the [RFC5646] language tag of the selected `display` and `ui_labels` entries as it appears in the metadata, or the string `default` if the default entries (entries without a `locale`) were shown. Enables deterministic reconstruction of which display entries were used.
```

- [ ] **Step 2: Replace `paso-core.md` line 173 with:**

```markdown
Locale selection **SHALL** follow [PaSO View] Section 4. The Wallet renders all `display` and `ui_labels` entries from a single locale, selected with the Lookup matching scheme defined in [RFC4647] Section 3.4. If no locale in its priority list matches, it renders all of them from the default entries (entries without a `locale`). The selection **SHALL** be reported in the `display_locale` claim (Section 6.1): the selected metadata `locale` tag, or the string `default`. It reflects the entries actually rendered, not the priority-list locale that led to the selection.
```

- [ ] **Step 3: Replace the `display_locale` bullet in `paso-proof-verify.md` (line 46) with:**

```markdown
   - `display_locale`: verify that it is either the string `default` or a [RFC5646] language tag. If it is `default`, verify that every claim `display` array and every `ui_labels` entry array of the matched transaction data type in the credential metadata contains a default entry (an entry without a `locale`). Otherwise, verify that every such array contains an entry whose `locale` equals `display_locale`, compared case-insensitively.
```

- [ ] **Step 4: Verify**

Run: `grep -c "regardless of whether individual\|locale from the Wallet's priority list that was selected" docs/specifications/paso-core.md`. Expected: `0`.

Run: `grep -c "SHALL NOT\*\* reject a presentation because" docs/specifications/proof/paso-proof-verify.md`. Expected: `0`.

Run: `grep -c "the string \`default\`" docs/specifications/paso-core.md docs/specifications/proof/paso-proof-verify.md`. Expected: each file ≥ 1.

Run: `make build`. Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add docs/specifications/paso-core.md docs/specifications/proof/paso-proof-verify.md
git commit -m "spec(core,verify): report and verify display_locale as rendered tag or default"
```

---

### Task 4: Examples, conformance fix, and checker

**Files:**
- Modify: `docs/specifications/proof/paso-proof-metadata.md`: append Annex A.6 after A.5, at the end of the file
- Modify: `docs/specifications/paso-view.md`: append `## Annex A: Examples` at the end of the file, after §6 References. This matches the annex placement in the other specs.
- Modify: `docs/rulebooks/transaction_data/Generic.md` line ~378 (A.3 `security_hint`)
- Add: `superpowers/checks/check_locale_consistency.py` (already written; commit it here)

**Interfaces:**
- Consumes: Tasks 1–3 semantics. The View annex links to Metadata Annex A.6 by name.

- [ ] **Step 1: Run the checker to see the existing violation**

Run: `python3 -I superpowers/checks/check_locale_consistency.py $(find docs -name '*.md')`

Expected: FAIL. The output reports `Generic.md:330: mixed locale sets`, with `ui_labels.security_hint: tags=['en']`.

- [ ] **Step 2: Fix Generic.md A.3**

Add a `de` entry to the `security_hint` array, after the `en` entry:

```json
{ "locale": "de", "value": "Streaming Co. kann bis zu 24 Monate lang jeden Monat bis zum angezeigten Betrag einziehen." }
```

- [ ] **Step 3: Append Metadata Annex A.6 to `paso-proof-metadata.md`**

Use the heading `### A.6 Transaction Data Type with Default Entries`.

Intro sentence: "A `transaction_data_types` entry that serves `en`, `de`, and default entries. Every `display` array and every `ui_labels` entry array carries the same locales and a default entry, as required by Section 3.3. Here the default entries carry the issuer's fallback text in English; a default entry has no `locale`, so the Wallet cannot know its language and reports `default` when it is shown (see [PaSO View] Annex A)."

The JSON block is the A.2 payment claims, with these exact display entries:

- `amount`: `en` "Amount", `de` "Betrag", default "Amount".
- `payee.name`: `en` "Payee", `de` "Empfänger", default "Payee".

Plus `ui_labels`:

- `affirmative_action_label`: `en` "Confirm Payment", `de` "Zahlung bestätigen", default "Confirm Payment".
- `security_hint`: `en` "Your bank will never ask you to confirm a payment by phone.", `de` "Ihre Bank fordert Sie niemals telefonisch zur Bestätigung einer Zahlung auf.", default the same English text.

Keep the A.2 claims `transaction_id` and `payee.id` (no `display`). Write default entries as `{ "name": "Amount" }` and `{ "value": "Confirm Payment" }`, placed last in each array.

- [ ] **Step 4: Append View Annex A to `paso-view.md`**

Headings are `## Annex A: Examples`, then the note `_**Note**: This annex is **informative**._`, then `### A.1 Locale Selection`.

Intro sentence: the examples apply Section 4 to [PaSO Proof Metadata] Annex A.6, whose available tags are `en` and `de`, with default entries in every array.

Table with these exact rows:

| Wallet locale priority list | Lookup | Entries rendered | `display_locale` |
|---|---|---|---|
| `de`, `en` | `de` matches `de` | `de` | `de` |
| `de-CH` | `de-CH` truncates to `de`, which matches | `de` | `de` |
| `fr`, `de` | `fr` no match; `de` matches | `de` | `de` |
| `fr` | no match | default | `default` |

Then three short paragraphs:

1. Row 3: German is shown although the first preference, `fr`, is unavailable, because a locale-tagged match anywhere in the priority list takes precedence over the default entries. Row 4: the user sees the issuer's fallback text, and the proof says so: `display_locale` is `default`, not `fr`.
2. If the same metadata carried no default entries, row 4 would produce no selection, and the Wallet would exclude the credential.
3. Exclusion example. Suppose the `de` entry of the `amount` `display` array carried a `display_type` the Wallet does not support. Then `de` is not an available tag. With priority list `de`, `en`, the Wallet renders all `en` entries and reports `en`. It does not render `amount` in English and the other labels in German.

- [ ] **Step 5: Verify**

Run: `python3 -I superpowers/checks/check_locale_consistency.py $(find docs -name '*.md')`. Expected: `checked 11 type metadata objects, 0 non-conforming`, exit 0. That is 10 before plus A.6.

Run: `make build`. Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add docs/specifications/proof/paso-proof-metadata.md docs/specifications/paso-view.md docs/rulebooks/transaction_data/Generic.md superpowers/checks/check_locale_consistency.py
git commit -m "docs: add default-entry and locale selection examples; fix mixed locales in Generic A.3"
```

---

## Final Verification

- `make build` exits 0.
- The checker over all of `docs/` reports `0 non-conforming`.
- `grep -rn "display_locale" docs` shows no text that defines the value as the priority-list locale.
- Read PaSO View §4 and the new annex together. Every row of the table follows from the §4 steps as written.