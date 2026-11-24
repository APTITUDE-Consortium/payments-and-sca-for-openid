# PaSO Displayed Claims Limit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Wallet-defined bound of at least 200 rendered items with a fixed, spec-wide limit of 10 displayed claim values per `transaction_data` entry, and cap declared displayed claims at 10 in the metadata.

**Architecture:**
- The work is Markdown spec edits on `draft-3`, with one commit per document.
- The "tests" are grep checks for removed and required wording, plus the strict MkDocs build.

**Tech Stack:** MkDocs Material via `uvx`. `make build` runs `mkdocs build --strict`.

**Spec:** `superpowers/specs/2026-11-24-paso-displayed-claims-limit-design.md`

## Global Constraints

- **Baseline:** `make build` exits 0 on `draft-3` at `289aa32`. Every task must leave it at 0. Run `rm -rf site` afterwards.
- **The limit is exactly 10.** It counts displayed claim values only. The cap of 100 total claim metadata objects stays unchanged.
- **The term is "displayed claim values".** Use it consistently in both documents.
- **Keep the spec style:**
  - RFC 2119 keywords in `**BOLD**`.
  - `[Reference]` names resolved in each file's references table.
  - New §6 subsections marked as part of the informative section.
- **No renumbering.** The new View subsection is appended as §6.5, and no existing section number changes.
- **No edits beyond this feature.** Leave §6.1 "rendering caps" as is; it remains accurate.

## Review Focus

1. **Array wildcards.** One declared claim with a `null` path can expand beyond 10. The metadata cap does not catch this, so the View §2 text must count values "after array wildcard expansion". Pinned by the Task 1 Step 1 grep.
2. **Static rendering omitting claims.** In static rendering the Wallet may skip claims such as `payee.logo`. That must not change the count, because compatibility must not depend on the rendering mode. Pinned by the Task 1 grep for "dynamic and static rendering".
3. **Absent optional claims.** An optional displayed claim missing from the `payload` does not count. Pinned by the Task 1 grep for "present in the `payload`".
4. **UI elements counted by mistake.** The old text counted UI elements; the new text must exclude them explicitly. Pinned by the Task 1 grep for "UI elements do not count".
5. **Leftover old wording.** Phrases like "at least 200" or "bound on rendered items" left anywhere in `docs/`, including the §5.3 cross-reference, would contradict the new rule. Pinned by the Task 1 Step 1 and Task 2 Step 4 greps over `docs/`.

---

### Task 1: PaSO View — fixed limit of 10 displayed claim values

**Files:**
- Modify: `docs/specifications/paso-view.md`
  - §2, the last paragraph, around line 48 ("The Wallet **SHALL** enforce an upper bound …").
  - §5.3, the paragraph around line 190, the clause "and the bound on rendered items applies".
  - §6: insert a new §6.5 after §6.4 "Confusable Text and Wallet Chrome Spoofing", before "## 7 References".

**Interfaces:**
- Produces: `[PaSO View] Section 2` as the normative home of the "displayed claim values" limit. Task 2 cites it.

- [ ] **Step 1: Write the failing checks**

```bash
f=docs/specifications/paso-view.md
! grep -rn -E "at least 200|bound on rendered items|rendered items" docs/ \
&& grep -q 'more than 10 displayed claim values' $f \
&& grep -q 'present in the `payload`' $f \
&& grep -q 'after array wildcard expansion' $f \
&& grep -q 'UI elements do not count' $f \
&& grep -q 'dynamic and static rendering' $f \
&& grep -q 'limit on displayed claim values applies' $f \
&& grep -q '^### 6.5 Why the Number of Displayed Claim Values Is Limited$' $f \
&& echo PASS || echo FAIL
```

- [ ] **Step 2: Run the checks to verify they fail**

Expected: `FAIL`, because the 200 wording is still present.

- [ ] **Step 3: Replace the §2 paragraph with this exact text**

```markdown
A `transaction_data` entry **MUST NOT** contain more than 10 displayed claim values. Displayed claim values are the instances, present in the `payload`, of claims that have a `display` array, counted after array wildcard expansion. UI elements do not count toward this limit. The count is the same in dynamic and static rendering, even where static rendering omits a claim. The Wallet **SHALL** be able to render 10 displayed claim values. A `transaction_data` entry that exceeds this limit is not compatible and the Wallet **SHALL** exclude it.
```

- [ ] **Step 4: In §5.3, replace "and the bound on rendered items applies" with "and the limit on displayed claim values applies"**

- [ ] **Step 5: Add §6.5 with the heading `### 6.5 Why the Number of Displayed Claim Values Is Limited`**

Write one short paragraph covering three points:
- A user can realistically review only a small number of values before confirming.
- A single fixed limit makes behaviour identical across Wallets, so a transaction cannot work in one Wallet and fail in another. Wallets design for a known maximum.
- Exceeding the limit leads to exclusion, not truncation, for the reasons in Section 6.2.

- [ ] **Step 6: Run the checks and the build**

Run the Step 1 command, then `make build; echo $?; rm -rf site`.
Expected: `PASS`, then `0`.

- [ ] **Step 7: Commit**

```bash
git add docs/specifications/paso-view.md
git commit -m "docs: replace rendered-items bound with a fixed limit of 10 displayed claim values in PaSO View"
```

### Task 2: Metadata Module — cap declared displayed claims at 10

**Files:**
- Modify: `docs/specifications/proof/paso-proof-metadata.md`
  - §3.3, the first structural-constraint bullet, around line 109.

**Interfaces:**
- Consumes: the term "displayed claim values" and `[PaSO View] Section 2` from Task 1.
- Unchanged and relied upon:
  - The last sentence of §3.3 already makes a type that violates the constraints "not supported".
  - §5.3 step 4, around line 169, already validates ad-hoc `metadata` against §3.3.

- [ ] **Step 1: Write the failing check**

```bash
f=docs/specifications/proof/paso-proof-metadata.md
grep -q 'more than 100 claim metadata objects' $f \
&& grep -q 'more than 10 claim metadata objects with a `display` array' $f \
&& grep -q 'conforms to Sections 3.1, 3.2, and 3.3' $f \
&& echo PASS || echo FAIL
```

- [ ] **Step 2: Run it to verify it fails**

Expected: `FAIL`.

- [ ] **Step 3: Replace the bullet with this exact text**

```markdown
- The `claims` array **MUST NOT** contain two claim metadata objects with the same `path`, **MUST NOT** contain more than 100 claim metadata objects, and **MUST NOT** contain more than 10 claim metadata objects with a `display` array. The limit on displayed claim values in a `transaction_data` entry, after array wildcard expansion, is defined in [PaSO View] Section 2.
```

- [ ] **Step 4: Run the check, the Task 1 check and the build**

Run the Step 1 command, the Task 1 Step 1 command, then `make build; echo $?; rm -rf site`.
Expected: `PASS`, `PASS`, `0`.

- [ ] **Step 5: Commit**

```bash
git add docs/specifications/proof/paso-proof-metadata.md
git commit -m "docs: cap displayed claims at 10 in the Metadata Module structural constraints"
```