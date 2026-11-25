# PaSO: Changelog draft-2 → draft-3 — Design

Date: 2026-11-25 · Branch: `draft-3` · Size: small change (one new page, two small edits)

## Intent

Implementers who built against draft-2 need to know what to change for draft-3. The specification has no changelog. Draft-3 differs from draft-2 in 57 commits that touch `docs/`. Some changes break draft-2 implementations: removed rulebooks and value types, a new required claim, and an envelope that no longer accepts plain JSON. **Reader (user): implementers.**

## Goals

- A page `docs/changelog.md` with a section "draft-3 (changes since draft-2)". Later drafts add their section on top.
- **Part 1, "What to change", by role** *(structure chosen by the user)*:
  - Roles: Wallet, Relying Party, Attestation Provider, Authorizing Party, and Rulebook authors.
  - Each item is tagged **Breaking**, **New** or **Clarified** and links to the governing section.
  - Breaking items come first within each role.
- **Part 2, "Changes by document":** a short list per document. It includes a "Removed" list (Generic and Mandate rulebooks, SVG module, `template` and `mini_markdown` value types).
- Changes are described as they stand in draft-3, not in commit order. Intermediate states that were later reverted are not listed.
- `index.md` "Purpose of this document" gains one sentence pointing to the changelog.
- Updating the changelog becomes a step in every remaining review finding. This is recorded in the review doc's process line.

## Non-goals

- **A commit-level history.** Git keeps that.
- **Changes to the documents themselves.** The changelog only describes them.
- **Review finding numbers in the changelog.** They are internal; the changelog cites spec sections.

## Approaches considered

- **Chosen: by role, then by document** (user's pick). A team building one role reads one list.
- **Rejected: by document only.** Every team would read everything to find its own changes.
- **Rejected: Keep a Changelog style** (Added / Changed / Removed). One topic gets split across headings, and the reader can't see who is affected.

## Content sources

- **Baseline:** `origin/draft-2` (`2187b3d`), the published draft-2. The local `draft-2` branch is one commit behind and is not used.
- **Evidence:** `git diff origin/draft-2 draft-3 -- docs`, read per document, with the commit subjects as an index of themes. Every changelog item must be traceable to that diff.

## Calls made (correct if wrong)

- **Rulebook authors are a fifth group,** because rulebooks gained obligations (Static Presentation section, role obligations, ad-hoc consistency).
- **Tags:** *Breaking* means a draft-2-conformant implementation of that role is no longer conformant. *New* is an optional or additive capability. *Clarified* is a resolved ambiguity whose intended behaviour didn't change.
- **Links are relative Markdown links to the module pages, with the section number in the link text** (for example "Core §7.5"). `mkdocs build --strict` fails on broken page links, but by default only logs broken anchors, so anchors would rot unnoticed.