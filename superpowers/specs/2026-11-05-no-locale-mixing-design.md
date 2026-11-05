# Design: No Locale Mixing, `"default"` as a Reportable Locale

Date: 2026-11-05 · Branch: `draft-2` · Size: small change (one concept, edits across four specs plus examples)

## Intent

PaSO's proof must make clear exactly what the user saw. Today it doesn't when default entries (entries without `locale`) are involved:

- A single consent screen can mix sources: some arrays render a `de` entry, others a default entry. The proof reports `display_locale: "de"`.
- If every array has a default, the first locale in the Wallet's priority list always "matches". A Wallet with `["fr", "de"]` reports `"fr"` and shows the defaults, even though German was available.

In both cases `display_locale`, defined in PaSO Core §6.1 as "the locale shown to the user", is false on its face. Replaying §4 recovers the truth, but anyone reading the proof without replaying is misled.

The original ask was to add an example of default entries. There were none in the repo. That example is still delivered (see Examples), on top of the corrected semantics.

## Goals

- Locales are never mixed. A consent screen renders entirely from one locale tag, or entirely from default entries.
- `display_locale` states what was displayed: the metadata `locale` tag that was rendered, or the literal string `"default"`.
- A locale-tagged match anywhere in the priority list beats the default entries.
- Informative examples of default entries and of locale selection.

## Non-goals

- No change to `ui_labels` identifiers, label constraints, value types, or the `Accept-Language` negotiation of PaSO Proof Metadata §2.
- No new proof claims. `display_locale` keeps its name and CBOR type (`tstr`).

## Anti-goals

- Any rule under which the proof names a language the user did not see.
- Any per-array fallback that could produce a mixed screen.

## Approaches considered

1. **Reword only.** Redefine `display_locale` as "the selected locale". No wire change, but the proof still reads `"fr"` for English text. Rejected: it documents the flaw instead of fixing it.
2. **Flag or list claim** next to `display_locale`, marking that defaults were used, or where. The list duplicates what replay derives and adds a consistency check. Rejected in favour of 3.
3. **`"default"` as a reportable value, with no mixing.** **Picked.** Locale selection either renders one tag throughout or defaults throughout, so a single string is always truthful and replay is trivial. Cost: an issuer that wants one shared untranslated string, such as a legal `security_hint`, repeats it under every locale tag. A partial translation is no longer shown partially; the Wallet moves on to the next locale or the defaults instead.

A variant of 3, reporting `"default"` only when all arrays matched defaults but keeping per-array fallback, was rejected because the mixed case stays misleading.

## The design

### Metadata constraint (PaSO Proof Metadata §3.2, §3.3)

Within one `transaction_data_types` entry, every `display` array of a claim that has one, and every `ui_labels` entry array:

- **MUST** contain entries for exactly the same set of `locale` tags, and
- **MUST** either all contain a default entry or all not contain one.

This is the user's rule ("if a language or default is used, it must be provided for all labels and claims"), stated as an issuer obligation. A violation makes the type "not supported by the credential", the same consequence as the existing §3.3 constraints. **My call, for a reason:** without identical tag sets, RFC 4647 Lookup can still mix locales through truncation. A range `de-CH` could match `de-CH` in one array and `de` in another.

The §3.2 sentences "the Wallet uses them when no entry matches the Wallet's locale" and "an array that provides a default entry is compatible with any Wallet locale" are rewritten to point at the new §4.

### Locale selection (PaSO View §4)

Because all arrays share one tag set, selection runs once against that set rather than per array:

1. For each locale in the priority list, in order: apply RFC 4647 Lookup against the shared tag set. On a match, the selected locale is the **matched metadata tag**. Render every array from its entry with that tag. Stop.
2. If no locale in the priority list matched and the arrays carry default entries, render every array from its default entry. The selected locale is `"default"`.
3. Otherwise, exclude the credential.

Entries already excluded by existing rules are dropped before matching:

- An unsupported `display_type` (§3).
- A `template:` entry discarded because a referenced claim is absent from the payload (§3).

If that leaves any array without an entry for the current tag, the tag does not match. The Wallet moves on to the next locale, then to the defaults. No mixing results. The §3 template text "fall back to the next locale in its priority list per Section 4" stays; add "or to the default entries".

The current paragraph stating that default entries do not affect locale selection is removed.

### Reporting (PaSO Core §6.1, §7.2)

`display_locale` is either the `locale` tag from the metadata that was rendered, or the literal `"default"`. It is no longer the Wallet's priority-list entry.

**My call, the same principle applied:** a Wallet preferring `de-CH` that renders `de` entries reports `"de"`.

The CBOR type stays `tstr`. `"default"` is a well-formed but unregistered RFC 5646 primary subtag. The definition says explicitly "an RFC 5646 language tag or the string `default`".

### Verification (PaSO Proof Verify §3 step 4)

- If `display_locale` is `"default"`, every `display` and `ui_labels` array **MUST** contain a default entry.
- Otherwise, every array **MUST** contain an entry whose `locale` equals `display_locale`, compared case-insensitively per RFC 5646.

Lookup is no longer needed at verification. The current "SHALL NOT reject because `display_locale` is not itself listed" sentence is removed: it is now always listed, or it is `"default"`.

### Compatibility statements (PaSO Proof Metadata §4 and §5)

Keep the sentences saying that metadata matching only through default entries **SHALL NOT** be refused or treated as incompatible on locale grounds. Reword "complete match per PaSO View §4" to the new selection.

### Examples (informative)

- **PaSO Proof Metadata Annex A.6:** a `transaction_data_types` entry with `en`, `de`, and a default entry in every `display` and `ui_labels` array.
- **PaSO View, new Annex A:** a selection walkthrough against A.6.

The walkthrough covers these cases:

| Priority list | Rendered | `display_locale` |
|---------------|----------|------------------|
| `["de", "en"]` | `de` | `"de"` |
| `["de-CH"]` | `de` (via Lookup) | `"de"` |
| `["fr", "de"]` | `de` | `"de"` |
| `["fr"]` | default entries | `"default"` |

It also covers metadata where the same arrays carry no default entry. With `["fr"]` the credential is excluded.

- **PaSO Core Annex A:** no change needed. Its examples report `"de"`, which stays valid.

### Also touched

- `docs/index.md` line 135 already says the proof records "precisely which text the user saw". It becomes true; no edit.

## Left to the builder

- Exact wording and placement within each section.
- Whether A.6 reuses the A.2 payment claims; preferred, for continuity.
- Rulebook examples (Payment, Generic, Mandate) use `en` and `de` only, with consistent tag sets. They are already conformant and need no edits; verify while editing.