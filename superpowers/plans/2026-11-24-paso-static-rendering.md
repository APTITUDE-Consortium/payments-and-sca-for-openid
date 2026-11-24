# PaSO Static Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional static rendering mode for rulebooks that opt in (starting with Payment). Dynamic, metadata-driven rendering stays mandatory for every Wallet. Record the mode used in the proof as `render_mode`.

**Architecture:** Markdown spec edits on `draft-3`, one commit per task. The "tests" are grep checks for leftover or missing wording, plus the strict MkDocs build, which fails on broken links.

**Tech Stack:** MkDocs Material via `uvx`. `make build` runs `mkdocs build --strict`.

**Spec:** `superpowers/specs/2026-11-24-paso-static-rendering-design.md`

## Global Constraints

- Baseline: `make build` exits 0 on `draft-3` at `db15b02`. Every task must leave it at exit 0. Run `rm -rf site` afterwards.
- Keep the spec style:
  - RFC 2119 keywords in `**BOLD**`.
  - `[Reference]` names resolved in each file's references table.
  - Annexes marked informative.
- Mode names, exactly: "static rendering" and "dynamic rendering". The proof claim is `render_mode` with the values `static` and `dynamic`. The rulebook section is titled "Static Presentation".
- Do not renumber sections that other files cite. The only renumbering allowed is in `paso-view.md`: §5 Security Considerations becomes §6, §6 References becomes §7, and Annex A is unchanged.
- No editorial changes beyond what this feature requires.

## Review Focus

1. **Proofs from static mode rejected by Verify.**
   - Today the `display_locale` check in `paso-proof-verify.md` step 4 requires the tag to appear in every metadata array. A static proof that reports the Wallet's UI language, for example `fr`, would fail it.
   - The check must branch on `render_mode`.
   - Checked in Task 4 Step 2 and by re-reading it against Task 1 §5.4.
2. **Citation drift from the View renumbering.**
   - The `image` row in `paso-view.md` says "See Section 5". It must become Section 6.3.
   - No external file may cite `[PaSO View] Section 5` or `Section 6` with the old meaning. Today none do.
   - Checked by the Task 1 grep.
3. **Static mode used as a loophole for §2 safeguards.** The new View §5 must state that these still apply in static mode:
   - full display before confirmation;
   - no truncation of labels or of claim values, including `payee.name`;
   - value-type formatting;
   - the exclusion rules.
   
   Checked by the Task 1 grep on "Section 2" inside §5.
4. **Leftover conditional `ui_labels` wording.** Metadata §3 still says "REQUIRED when … does not have a dedicated UI". It must become unconditional. Checked by the Task 3 grep.
5. **The advanced profile with mixed modes.**
   - When the user switches credentials, the entry shown may change type and so change mode.
   - `render_mode` and `display_locale` must describe the entry actually presented for that credential.
   - Checked by the explicit sentence required in Task 1 §5.2 and Task 2's §6.1 wording.

---

### Task 1: PaSO View — add §5 Static Rendering

**Files:**
- Modify: `docs/specifications/paso-view.md`
  - §1.1, paragraph 2 (line 13).
  - §4, intro (line 144ff).
  - The `image` row, "See Section 5" (around line 89).
  - Headings "## 5 Security Considerations" (line 164), "### 5.1"–"### 5.4", and "## 6 References" (line 184).

**Interfaces:**
- Produces: `[PaSO View] Section 5` (Static Rendering), with subsections 5.1 Eligibility, 5.2 Mode Selection, 5.3 Presentation Obligations, 5.4 Locale and `display_locale`. Tasks 2–5 cite these numbers.

- [ ] **Step 1: Rewrite §1.1 paragraph 2.**
  - The Wallet **SHALL** be able to render any transaction data type with dynamic rendering, driven by the metadata alone.
  - For transaction data types whose rulebook contains a Static Presentation section, the Wallet **MAY** use static rendering instead, per Section 5.
  - Delete the old "dedicated UI in place of the generic renderer" sentence.

- [ ] **Step 2: Scope §4 to locale selection from metadata.**
  - Add one sentence at the start of §4: this procedure applies to dynamic rendering, and to static rendering when a `security_hint` is present (Section 5.4).

- [ ] **Step 3: Renumber.**
  - "## 5 Security Considerations" becomes "## 6", and its subsections become 6.1–6.4.
  - "## 6 References" becomes "## 7".
  - In the `image` row, "See Section 5" becomes "See Section 6.3".

- [ ] **Step 4: Insert "## 5 Static Rendering" before Security Considerations**, with these normative rules.
  - **5.1 Eligibility.** The Wallet **MAY** render a `transaction_data` entry statically only if all of the following hold:
    - (a) the applicable Transaction Data Type Rulebook contains a Static Presentation section per [PaSO Core] Section 5.3;
    - (b) the Wallet implements that rulebook for that exact type identifier, including the version;
    - (c) the entry does not carry an ad-hoc `metadata` parameter.
    
    Otherwise the Wallet **SHALL** render dynamically.
  - **5.2 Mode Selection.**
    - The Wallet selects the mode per `transaction_data` entry. The Attestation Provider and the Relying Party cannot require or prohibit static rendering.
    - In the advanced profile, the mode applies to the entry presented for each credential, and **MAY** differ between credentials.
    - The selected mode **SHALL** be reported in `render_mode` per [PaSO Core] Section 6.1.
    - Signed credential metadata is still retrieved and verified. The `payload` **SHALL** conform to both the rulebook and the metadata `claims`. Static rendering does not change which types a credential supports.
  - **5.3 Presentation Obligations.**
    - The Wallet **SHALL** display the content the Static Presentation section requires, as it requires.
    - It uses its own layout and its own localised labels, and ignores the `display` entries and the `ui_labels` other than `security_hint`.
    - These Section 2 rules still apply:
      - full display before enabling confirmation;
      - no truncation, elision or shortening of any label or displayed value;
      - value formatting per Section 3;
      - the directional-character exclusion;
      - the rendered-item bound.
    - The Wallet's own labels **SHALL** convey the meaning defined by the rulebook clearly and unmistakably.
    - A present `security_hint` **SHALL** be displayed exactly as provided.
  - **5.4 Locale and `display_locale`.**
    - The screen uses a single language.
    - If the type's metadata provides a `security_hint`, the Wallet **SHALL** perform locale selection per Section 4.
      - If that selects the default entries, or a tag in whose language the Wallet cannot render its static presentation, the Wallet **SHALL** render dynamically.
      - Otherwise it renders the static presentation in the selected language and reports the selected tag in `display_locale`.
    - Without a `security_hint`, the Wallet reports the [RFC5646] tag of the language it rendered in.
    - In static rendering, `display_locale` is never `default`.

- [ ] **Step 5: Verify**

Run: `grep -nE '^## [0-9]|^### [0-9]' docs/specifications/paso-view.md`
Expected: 1, 1.1, 1.2, 2, 3, 4, 5, 5.1–5.4, 6, 6.1–6.4, 7.

Run: `grep -nE 'dedicated UI|See Section 5' docs/specifications/paso-view.md`
Expected: no output.

Run: `grep -rnE 'PaSO View\] Section [67]' docs`
Expected: no output.

Run: `awk '/^## 5 Static/,/^## 6 /' docs/specifications/paso-view.md | grep -c 'Section 2'`
Expected: at least 1.

Run: `make build; rm -rf site`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add docs/specifications/paso-view.md
git commit -m "docs: add static rendering mode to PaSO View"
```

### Task 2: PaSO Core — rulebook requirements, `render_mode`, `display_locale`

**Files:**
- Modify: `docs/specifications/paso-core.md`
  - §5.3 (lines 106–119).
  - §6.1 table (lines 130–140).
  - §6.3 table (lines 152–161).
  - §7.2 (line 173).
  - Annex A.2 (around line 309) and A.3 (around line 339).

**Interfaces:**
- Consumes: `[PaSO View] Section 5`, 5.2 and 5.4 from Task 1.
- Produces:
  - `[PaSO Core] Section 5.3`: the Static Presentation requirements.
  - The `render_mode` claim in §6.1 and §6.3, cited by Tasks 4 and 5.

- [ ] **Step 1: Extend §5.3.** Add a paragraph saying a rulebook **MAY** include a Static Presentation section that enables static rendering per [PaSO View] Section 5. When it does, the section **SHALL** define:
  - (a) which claims **SHALL** be displayed in static rendering, and which **MAY** be omitted;
  - (b) the display obligations for each displayed claim, such as prominence and completeness;
  - (c) the meaning of the affirmative and denial actions.
  
  Also state that the Static Presentation section is part of the semantic structure, so changing it requires a new type version.

- [ ] **Step 2: Add a `render_mode` row to the §6.1 table, after `display_locale`.** Exact text:

```markdown
| `render_mode`               | yes         | The rendering mode used for the transaction data shown during consent: `dynamic` or `static`, per [PaSO View] Section 5.2.                                                                                                                       |
```

- [ ] **Step 3: Rewrite the `display_locale` description in §6.1.**
  - Dynamic rendering: unchanged meaning, per [PaSO View] Section 4.
  - Static rendering: per [PaSO View] Section 5.4. Never `default`.

- [ ] **Step 4: Update the §6.3 mdoc table.** Add `| \`render_mode\` | tstr |` after `display_locale`.

- [ ] **Step 5: Update §7.2.**
  - Prefix the existing text with "For dynamic rendering,".
  - Append: "For static rendering, `display_locale` is determined per [PaSO View] Section 5.4."

- [ ] **Step 6: Update the Annex A.2 and A.3 examples.** Add `"render_mode": "dynamic"` after `display_locale`, in JSON and CBOR-diagnostic style to match each example.

- [ ] **Step 7: Verify**

Run: `grep -c 'render_mode' docs/specifications/paso-core.md`
Expected: at least 5.

Run: `grep -n 'Section 5.4' docs/specifications/paso-core.md`
Expected: hits in §6.1 and §7.2.

Run: `make build; rm -rf site`
Expected: exit 0.

- [ ] **Step 8: Commit**

```bash
git add docs/specifications/paso-core.md
git commit -m "docs: add render_mode and static presentation requirements to PaSO Core"
```

### Task 3: Metadata — make `ui_labels` unconditional; retarget dedicated-UI clauses

**Files:**
- Modify: `docs/specifications/proof/paso-proof-metadata.md`
  - The §3 `ui_labels` bullet (line 42).
  - The last paragraph of §3.1 (line 63).
  - The last paragraph of §3.2 (line 83).

**Interfaces:**
- Consumes: `[PaSO View] Section 5` from Task 1.

- [ ] **Step 1: Make the `ui_labels` bullet in §3 unconditional.**
  - It becomes: "**`ui_labels`**: **REQUIRED**. Object providing localised strings for the consent UI per Section 3.2."
  - Reason: every Wallet must be able to render dynamically.

- [ ] **Step 2: Rewrite the §3.1 last paragraph.**
  - `display` entries and `value_type` drive dynamic rendering.
  - In static rendering per [PaSO View] Section 5, the Wallet uses its own labels in place of the `display` entries, as constrained by the rulebook's Static Presentation section.
  - Delete "a Wallet that implements a specific rulebook **MAY** provide its own labels…".

- [ ] **Step 3: Rewrite the §3.2 last paragraph the same way.** Keep the `security_hint` exception, citing [PaSO View] Section 5.3.

- [ ] **Step 4: Verify**

Run: `grep -nE 'dedicated UI|implements a specific rulebook' docs/specifications/proof/paso-proof-metadata.md`
Expected: no output.

Run: `grep -c 'PaSO View\] Section 5' docs/specifications/proof/paso-proof-metadata.md`
Expected: at least 2.

Run: `make build; rm -rf site`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add docs/specifications/proof/paso-proof-metadata.md
git commit -m "docs: align Metadata ui_labels and label overrides with static rendering"
```

### Task 4: Verify, Risk Signals and Log modules

**Files:**
- Modify: `docs/specifications/proof/paso-proof-verify.md` step 4 (lines 41–48).
- Modify: `docs/specifications/proof/paso-proof-risk-signals.md` Annex A.2 (line 361) and A.3 (line 425).
- Modify: `docs/specifications/proof/paso-proof-log.md` §5 (line 51).

**Interfaces:**
- Consumes:
  - `render_mode` and the §5.3 Static Presentation requirements from Task 2.
  - `[PaSO View] Section 5.1` and `5.4` from Task 1.

- [ ] **Step 1: Add a `render_mode` bullet to Verify step 4, before `display_locale`.**
  - Verify that `render_mode` is `dynamic` or `static`.
  - If it is `static`:
    - verify that the applicable rulebook contains a Static Presentation section;
    - verify that the `transaction_data` entry carries no `metadata` parameter, per [PaSO View] Section 5.1.

- [ ] **Step 2: Branch the `display_locale` bullet.**
  - If `render_mode` is `dynamic`: today's check, unchanged.
  - If `render_mode` is `static`:
    - verify that `display_locale` is a [RFC5646] tag and not `default`;
    - if the matched type's metadata has a `security_hint`, verify that the `security_hint` array contains an entry whose `locale` equals `display_locale`, compared case-insensitively.

- [ ] **Step 3: Add `render_mode` to the Risk Signals examples.** Add `"render_mode": "dynamic",` after `display_locale` in both examples.

- [ ] **Step 4: Add one sentence to Log §5.** When `render_mode` is `static`, replay reproduces the static presentation of the Wallet version identified by `wallet_instance_version`.

- [ ] **Step 5: Verify**

Run: `grep -rc 'render_mode' docs/specifications/proof/paso-proof-verify.md docs/specifications/proof/paso-proof-risk-signals.md docs/specifications/proof/paso-proof-log.md`
Expected: at least 3, 2 and 1 respectively.

Run: `make build; rm -rf site`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add docs/specifications/proof/paso-proof-verify.md docs/specifications/proof/paso-proof-risk-signals.md docs/specifications/proof/paso-proof-log.md
git commit -m "docs: verify and record render_mode in the proof modules"
```

### Task 5: Payment rulebook — Static Presentation section

**Files:**
- Modify: `docs/rulebooks/transaction_data/Payment.md`
  - The `payee.logo` row description (line 17).
  - A new "## 3 Static Presentation" section between §2 and §3. §3 References becomes §4; nothing else cites Payment section numbers.
  - The references table: `[PaSO Core]` and `[PaSO View]` are already present; no change.
  - Annex A: new "A.2 Static Rendering" example.

**Interfaces:**
- Consumes:
  - the `[PaSO Core] Section 5.3` requirements from Task 2;
  - `[PaSO View] Section 5` from Task 1.

- [ ] **Step 1: Update the `payee.logo` row.** Replace "A dedicated UI **MAY** choose to not display it." with "**MAY** be omitted in static rendering (Section 3)."

- [ ] **Step 2: Write §3 Static Presentation.** It covers the three items of Core §5.3:
  - (a) Required:
    - `amount`, formatted per `iso_currency_amount`, shown as the most prominent value on the screen, with the full amount and currency;
    - `payee.name`, shown in full.
    
    Optional: `payee.logo`. If it is shown, the `image` rules of [PaSO View] Section 3 apply, and it **MUST NOT** replace the name.
    
    Not shown: `transaction_id`, `payee.id`, `payee.logo#integrity`.
  - (b) Obligations: the amount and the payee **SHALL** appear on the same screen as the confirmation action.
  - (c) Affirmative action: authorise a one-time payment of `amount` to the Payee. Denial: decline the payment.

- [ ] **Step 3: Add Annex A.2.**
  - An informative text sketch of a static screen for the A.1 transaction, with the Wallet's own wording in `fr`.
  - Show the resulting `"render_mode": "static"` and `"display_locale": "fr"`, and note that the A.1 metadata has no `security_hint`.

- [ ] **Step 4: Verify**

Run: `grep -nE 'dedicated UI' docs/rulebooks/transaction_data/Payment.md`
Expected: no output.

Run: `grep -nE '^## 3 Static Presentation|render_mode' docs/rulebooks/transaction_data/Payment.md`
Expected: the heading and at least one `render_mode` hit.

Run: `make build; rm -rf site`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add docs/rulebooks/transaction_data/Payment.md
git commit -m "docs: add Static Presentation to the Payment rulebook"
```

### Task 6: Overview — two rendering modes

**Files:**
- Modify: `docs/index.md`
  - The §5 "Generic, metadata-driven rendering" bullet (line 131).
  - §6 (lines 141–181): heading, 6.1, 6.2, 6.3.
  - The §4.1 proof description, if it enumerates the proof claims.
- Check: `README.md`. Change it only if it describes rendering paths.

- [ ] **Step 1: Rewrite §6 as "Two rendering modes".**
  - 6.1 "Static rendering: optimised UX for standardised types". It is optional, the rulebook opts in, the Wallet uses its own wording within the rulebook's obligations, signed metadata is still verified, and `render_mode` is recorded.
  - 6.2 "Dynamic rendering: metadata-driven", which every Wallet implements.
  - 6.3: keep the argument, reworded so it says dynamic rendering is mandatory, rather than "the path that makes it viable".
  - Remove the "it does not scale / A wallet can only transact a type it has already shipped" framing of static as an alternative.

- [ ] **Step 2: Update the §5 bullet.** It should describe static rendering as an optional optimisation on top of the mandatory generic renderer.

- [ ] **Step 3: Add `render_mode` to the §4.1 claim list, if that section lists `display_locale`.**

- [ ] **Step 4: Whole-branch verify**

Run: `grep -rniE 'dedicated (UI|consent)|static path|dynamic path|integration path' docs README.md`
Expected: no output.

Run: `grep -rln 'display_locale' docs | xargs grep -L 'render_mode'`
Expected: only `docs/specifications/proof/paso-proof-metadata.md`. It does not enumerate the proof claims.

Run: `make build; rm -rf site`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add docs/index.md README.md
git commit -m "docs: present static and dynamic rendering modes in the overview"
```