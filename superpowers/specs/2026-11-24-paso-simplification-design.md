# PaSO Simplification — Design

Date: 2026-11-24 · Branch: `draft-3` · Size: small change

## Intent

Simplify the PaSO specification set by removing features that add rendering and security complexity without being needed for the core use case. Generic (non-payment) transaction types stay supported, but only through ad-hoc transaction data metadata ([PaSO Proof Metadata] §5), not through a dedicated Generic rulebook.

## Goals

1. Remove the `template:${value_type}` and `mini_markdown` value types.
2. Remove the Generic and Mandate (e-mandate) transaction data rulebooks.
3. Remove SVG support entirely: the SD-JWT-VC and SVG module, and SVG as an `image` format.
4. Preserve "Metadata Source Priority" by moving it into the Metadata module.

## Non-goals

- No editorial rework beyond what the removals require. The discarded review commits (backup branch `backup/draft-3-unpushed-df80089`) are not reapplied.
- No change to the Payment rulebook's substance, to the Default risk profile, or to ad-hoc metadata semantics.

## Anti-goals

- Leaving dangling references, such as `[PaSO Proof SD-JWT-VC and SVG]`, `display_type`, `template:`, `mini_markdown`, or links to `Generic.md`/`Mandate.md`.
- Weakening the "wallet needs no update for new types" story in `index.md`. It must stay true and now point at ad-hoc metadata.

## Approaches considered

- **Chosen: edit in place, one commit per removal.** Each change is reviewable and revertible on its own.
- Cherry-pick `6a80611` (an earlier "remove SVG support"). Rejected: it is bundled with discarded editorial fixes.
- One big commit. Rejected: the spec diff would be hard to review.
- Deprecate instead of delete. Rejected: this works against the simplification.

## Decisions (agreed)

- **Labels become plain text only.** `mini_markdown` and `template:mini_markdown` were the only permitted label formats, so the `display_type` parameter on `display` entries and the `value_type` on `ui_labels` entries are removed.
- **Images are PNG and JPEG only.** All SVG-specific rules in the `image` value type are dropped (support, static rendering, embedded-resource integrity).
- **The Generic story moves to ad-hoc metadata.** `index.md` keeps the "any interaction type, no wallet update" argument, with ad-hoc `metadata` (Metadata §5) as the mechanism for types without a rulebook.

## Change list (by commit)

1. **Value types.**
   - `paso-view.md`: delete the `mini_markdown` and `template:${value_type}` rows; delete the `display_type` paragraph in §3; drop the `template:` clause in §2's label-constraint paragraph; make labels plain text.
   - `paso-proof-metadata.md`: remove `display_type` (around lines 59–60), the label format rule (around line 107), and the `template:` length rule (around line 116); remove `ui_labels` `value_type`.
   - Clear any matching uses from the examples and from `Payment.md`.
2. **Rulebooks.** Delete `docs/rulebooks/transaction_data/Generic.md` and `Mandate.md`. Remove all links and mentions of them elsewhere.
3. **SVG.**
   - Move SVG module §2 into `paso-proof-metadata.md` as a new section ("SD-JWT-VC Type Metadata"), adding `[OID4VCI]` and `[SD-JWT-VC]` to its references.
   - Delete `paso-proof-sd-jwt-vc-svg.md`.
   - In `paso-view.md`, narrow `image` to PNG and JPEG and remove SVG sentences and the module reference.
   - In `paso-proof-log.md`, remove "SVG templates / resources embedded within SVG documents" (lines 23 and 37) and the reference-table row.
   - In `paso-proof-risk-signals.md`, remove the reference-table row and any text mention (around line 230).
4. **Overview docs.**
   - `index.md`: module list (line 45), value-type list (line 131), the generic-rendering narrative (lines 159–180) pointing at ad-hoc metadata, and any Generic/Mandate mentions.
   - `README.md`: the rulebook line (line 17) and the module list.

## Verification

- `grep -rniE 'mini_markdown|template:|display_type|svg|Generic\.md|Mandate|\[Generic\]|sd-jwt-vc-svg' docs README.md` returns only intentional hits, such as the "Generic Rendering" heading and "mandates" used as a verb.
- `mkdocs build --strict` (or the Makefile target) succeeds with no broken-link warnings.

## Left to the builder

- Exact wording of the moved section and of the `index.md` narrative, keeping the existing spec style (RFC 2119 keywords, references tables).
- Renumbering sections where a deletion leaves a gap, and fixing any cross-references to the renumbered sections.