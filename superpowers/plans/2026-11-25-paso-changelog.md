# Changelog draft-2 → draft-3 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `docs/changelog.md` tells draft-2 implementers, role by role, what to change for draft-3, followed by a per-document change list. The intro points to it, and the review process keeps it current.

**Architecture:** One new Markdown page and two small edits. The content is derived from `git diff origin/draft-2 draft-3 -- docs`.

**Tech Stack:** Markdown, MkDocs Material (no `nav`; pages are picked up automatically).

**Spec:** `superpowers/specs/2026-11-25-paso-changelog-design.md`

## Global Constraints

- **Baseline:** `origin/draft-2` (`2187b3d`). Never use the local `draft-2`.
- **Every item traces to the diff.** Describe the draft-3 state, not the commit sequence.
- **Tags:** **Breaking** (a draft-2-conformant implementation of that role is no longer conformant), **New** (optional or additive), **Clarified** (ambiguity resolved, intended behaviour unchanged).
- **Links:** relative page links with the section number in the link text, for example `[Core §7.5](specifications/paso-core.md)`. No anchors.
- **No review finding numbers** in `docs/`.
- The strict build `.venv/bin/mkdocs build --strict -d /tmp/paso-site` exits 0 after every task that touches `docs/`.

## Page structure (fixed)

```text
# Changelog
## draft-3 (changes since draft-2)
  intro: baseline (draft-2, published as origin/draft-2), the three tags, and how to read the page
### What to change
#### Wallet
#### Relying Party
#### Attestation Provider
#### Authorizing Party
#### Rulebook authors
### Changes by document
#### Introduction
#### PaSO Core
#### PaSO View
#### Metadata Module
#### Verify Module
#### Risk Signals Module
#### Risk Signal Registry
#### Log Module
#### Payment rulebook
#### Default risk profile
#### Removed
```

## Review Focus

- **Reverted intermediate states.** Ad-hoc metadata was introduced in draft-3 as a replacement for signed metadata, then limited to unpublished types. Verify first checked each PaSO presentation, then exactly one. Only the final draft-3 state may appear. By contrast, `amr` changed between draft-2 and draft-3, so it is a real change and must be listed.
- **Removed documents and value types** must not be linked; the strict build catches page links.
- **Role coverage.** Every *Breaking* item in "Changes by document" appears under at least one role in "What to change".
- **Static vs dynamic.** Items that apply only to dynamic rendering must say so.
- **The proof package envelope** is a proposal (Verify §4). It must not be presented as mandatory for every deployment.

---

### Task 1: Research notes

**Files:** Create `.superpowers/sdd/2026-11-25-paso-changelog/notes.md` (git-ignored, not committed).

- [ ] For each document in "Changes by document", run `git diff origin/draft-2 draft-3 -- <path>` (for deleted files, `git show origin/draft-2:<path>` to know what was removed). Read the hunks and write per document:
  - One line per change: the draft-3 state, the tag, the affected roles, and the governing section.
- [ ] Use `git log --reverse --format='%h %s' origin/draft-2..draft-3 -- docs` as a checklist of themes. Tick every commit subject against a note line, or against "reverted / superseded" with the superseding commit.
- [ ] **Check:** every commit subject is ticked. Run `grep -c '^- ' notes.md` and record the count in the ledger.

### Task 2: "Changes by document"

**Files:** Create `docs/changelog.md`.

- [ ] **RED:** `test -f docs/changelog.md; echo $?`. Expected: `1`.
- [ ] Write the page header, the draft-3 intro, and the "Changes by document" part from the notes:
  - One bullet per change, starting with its tag in bold.
  - Each document heading links to its page.
  - "Removed" lists the Generic and Mandate rulebooks, the SD-JWT VC SVG module, and the `template` and `mini_markdown` value types, without links.
- [ ] **GREEN**
  - Run: `for h in 'Introduction' 'PaSO Core' 'PaSO View' 'Metadata Module' 'Verify Module' 'Risk Signals Module' 'Risk Signal Registry' 'Log Module' 'Payment rulebook' 'Default risk profile' 'Removed'; do printf '%s ' "$(grep -c "^#### $h\$" docs/changelog.md)"; done; echo`. Expected: `1` eleven times.
  - Run: `grep -c -E 'Generic|Mandate|SVG|template|mini_markdown' docs/changelog.md`. Expected: ≥ 1.
  - Then run the strict build. Expected: exit 0.
- [ ] **Commit:** `docs: changelog lists draft-3 changes by document`

### Task 3: "What to change"

**Files:** Modify `docs/changelog.md`.

- [ ] **RED:** `grep -c '^### What to change' docs/changelog.md`. Expected: `0`.
- [ ] Insert "What to change" before "Changes by document", with the five role headings. Derive the items from the notes: Breaking first, then New, then Clarified, each linking to its governing page. An item affecting two roles appears under both, worded for each.
- [ ] **GREEN**
  - Run: `for h in 'Wallet' 'Relying Party' 'Attestation Provider' 'Authorizing Party' 'Rulebook authors'; do printf '%s ' "$(grep -c "^#### $h\$" docs/changelog.md)"; done; echo`. Expected: `1 1 1 1 1`.
  - **Coverage check:** every `**Breaking**` bullet under "Changes by document" has a counterpart under some role. Done by reading; record the pairs in the ledger.
  - Run: `rg -n -i 'finding|#[0-9]+\b' docs/changelog.md`. Expected: no review finding numbers.
  - Then run the strict build. Expected: exit 0.
- [ ] **Commit:** `docs: changelog tells each role what to change for draft-3`

### Task 4: Intro pointer and process

**Files:** Modify `docs/index.md` ("Purpose of this document") and `superpowers/specs/2026-11-24-spec-review.md` (Handoff line).

- [ ] **RED:** `grep -c '(changelog.md)' docs/index.md; grep -cF 'update `docs/changelog.md`' superpowers/specs/2026-11-24-spec-review.md`. Expected: `0`, `0`.
- [ ] **index.md:** at the end of "Purpose of this document", add: "Changes between drafts, by role and by document, are listed in the [Changelog](changelog.md)."
- [ ] **Review doc, Handoff line:** in "Process per finding so far: … inline execution with grep RED/GREEN and `.venv/bin/mkdocs build --strict -d /tmp/paso-site`.", insert " → update `docs/changelog.md`" before the final period. Also append "Changelog `docs/changelog.md` added (design `2026-11-25-paso-changelog-design.md`)." to the Handoff line.
- [ ] **GREEN:** run the RED greps. Expected: `1`, `1`. Then run the strict build. Expected: exit 0.
- [ ] **Commit:** `docs: intro points to the changelog; review process keeps it current`

### Task 5: Branch check

- [ ] Run: `git diff --stat <plan commit>..HEAD -- docs/`
  - Expected: `docs/changelog.md` (new) and `docs/index.md`.
- [ ] Run: `grep -o '](specifications[^)]*)\|](rulebooks[^)]*)\|](index.md)' docs/changelog.md | sort -u`
  - Expected: only existing pages, and the strict build already proves they resolve.
- [ ] Run the strict build. Expected: exit 0.