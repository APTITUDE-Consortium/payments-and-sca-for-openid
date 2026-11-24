# PaSO Static Rendering — Design

Date: 2026-11-24 · Branch: `draft-3` · Size: small change

## Intent

PaSO gets two normatively defined rendering modes:

- **Dynamic (metadata-driven) mode.** This is today's generic renderer, driven by the Metadata Module and PaSO View. It stays mandatory for every Wallet and is the only mode for non-standard types.
- **Static mode.** This is an optional UX optimisation for highly standardised transaction types such as Payment. The Wallet shows a purpose-built consent screen with its own layout and wording, within obligations fixed by the type's rulebook.

The goal is a native, polished payment experience that does not give up the "no wallet update for new types" guarantee.

## Goals

1. A rulebook can opt into static rendering through a "Static Presentation" section. Payment.md does so.
2. PaSO View defines when a Wallet may render statically, which safeguards still apply, and when it must fall back to dynamic mode.
3. The proof records which mode was used (`render_mode`), so audit and replay can reconstruct the screen.
4. The existing loose "dedicated UI MAY …" clauses are replaced by references to static mode.

## Non-goals

- Static-only Wallets. Every Wallet still implements the Metadata Module and the generic renderer.
- Normative label strings in rulebooks.
- Static mode for ad-hoc metadata or for issuer-specific types without a Static Presentation section.
- Changes to value types, locale selection for dynamic mode, or the advanced profile.

## Anti-goals

- Weakening `metadata_integrity` or metadata-based type discovery. Both stay as they are.
- Mixing languages on one consent screen.
- Letting static mode drop any safeguard of PaSO View §2: full display before confirm, no truncation, value-type formatting, and the injection, confusable and chrome-spoofing considerations.
- Dangling "dedicated UI", "static path" or "dynamic path" wording that contradicts the new model.

## Approaches considered

- **Chosen: integrate into the existing documents** (View, Core, Metadata, Payment.md, index.md), one commit per document. Each rule lives where readers already look for it, with no duplication.
- A separate "PaSO View: Static Rendering" module. Rejected: it splits rendering across two documents, repeats the View safeguards, and Core and Metadata would need the same edits anyway.
- Rulebook-only. Rejected: every rulebook would restate the mode-selection rules and they would drift apart, and `render_mode` would not be fixed in the proof.

## Decisions (agreed)

- **Option A: static is optional and sits on top of dynamic.** Signed metadata is still fetched and verified, and it still determines which types a credential supports. `metadata_integrity` stays mandatory. The payload must conform to both the rulebook and the metadata `claims`.
- **Option 1: the Wallet's own wording, constrained by the rulebook.**
  - In static mode the Wallet supplies all labels and translations and ignores the issuer's `display` and `ui_labels`, with one exception: the `security_hint`, covered below.
  - The rulebook fixes three things: which claims must be shown, the display obligations (for example amount and payee unabbreviated and prominent, logo optional), and the meaning of the confirm and deny actions.
- **Eligibility (my call).** Only rulebooks with a Static Presentation section are static-capable. The Wallet may render statically only for a type and version whose rulebook it implements. A `transaction_data` entry carrying ad-hoc `metadata` is always rendered dynamically.
- **Mode choice (my call).** The Wallet chooses the mode per transaction. Neither the Attestation Provider nor the Relying Party can force or forbid static mode.
- **`security_hint` (my call).**
  - In static mode, a present `security_hint` is still displayed verbatim. Its entry is chosen by the locale selection of PaSO View §4, as today.
  - If the selected locale differs from the Wallet's UI language, the Wallet renders dynamically instead. This preserves the single-language rule.
- **Proof.**
  - New required claim `render_mode` with the value `static` or `dynamic`. It is a `tstr` data element in the mdoc profile.
  - In static mode, `display_locale` is the [RFC5646] tag of the language the Wallet rendered in.
  - In dynamic mode, `display_locale` keeps its current meaning.

## Change list (by commit)

1. **PaSO View** (`paso-view.md`).
   - §1.1: generic rendering is always available, and static rendering is permitted per the new section.
   - New section "Static Rendering", placed after §2. It covers eligibility, mode choice, the rulebook-defined obligations, which §2 safeguards still apply, the `security_hint` rule with dynamic fallback, and `display_locale` in static mode.
   - §4: note that it governs dynamic mode and the `security_hint` selection.
   - Renumber the later sections and fix cross-references.
2. **PaSO Core** (`paso-core.md`).
   - §5.3: define what a Static Presentation section must contain.
   - §6.1: add `render_mode` and adjust the `display_locale` description.
   - §6.3: add the `render_mode` data element.
   - §7.2: adjust to cover both modes.
   - Annex A.2 and A.3: add `render_mode` to the examples.
3. **Metadata** (`paso-proof-metadata.md`).
   - §3: `ui_labels` becomes REQUIRED for each published type, since every Wallet must be able to render dynamically.
   - §3.1 and §3.2: replace the "Wallet that implements a specific rulebook MAY replace …" clauses with a reference to static rendering in PaSO View.
4. **Verify, Risk Signals and Log modules.**
   - Add `render_mode` to the claim lists and examples wherever the SCA response claims are enumerated (`paso-proof-verify.md`, `paso-proof-risk-signals.md`).
   - Verify: the Authorizing Party checks that `render_mode` is `dynamic`, or `static` with a type whose rulebook has a Static Presentation section.
   - `paso-proof-log.md`: no change expected beyond what the proof already carries. Confirm during the build.
5. **Payment rulebook** (`Payment.md`).
   - Add a "Static Presentation" section.
   - Replace the "A dedicated UI MAY choose to not display it" wording on `payee.logo`.
   - Add an example of the static screen next to the existing generic one.
6. **Overview** (`index.md`, `README.md` if affected).
   - Rewrite §6 from "two integration paths" into two rendering modes: static as an optimisation for standardised types, dynamic as mandatory and the only mode for non-standard types.
   - Adjust the "dedicated UI" sentence in §5 to match.

## Verification

- `grep -rniE 'dedicated (UI|consent)|static path|dynamic path' docs README.md` leaves only intentional hits.
- Every enumeration of the SCA response claims includes `render_mode`: Core §6.1, Core §6.3, the Core examples, and the Verify and Risk Signals modules.
- `make build` (strict mkdocs build) succeeds with no broken-link warnings.

## Left to the builder

- Exact wording, following the existing spec style: RFC 2119 keywords, references tables, informative annexes.
- The precise obligations in Payment.md's Static Presentation section, within the agreed shape: amount and payee always shown, unabbreviated and prominent; logo optional; `transaction_id` and `payee.id` not required on screen; confirm means "authorise this payment".
- Section numbering and cross-reference fixes.