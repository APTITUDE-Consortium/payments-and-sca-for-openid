# PaSO Static-Only Rendering for Static Types — Design

Date: 2026-11-27 · Branch: `draft-3` · Size: project (touches Core, View, Proof Metadata, Proof Verify, Payment, overview, changelog)

Supersedes parts of `2026-11-24-paso-static-rendering-design.md` (mode choice, `security_hint`, `render_mode`, "no normative label strings in rulebooks").

## Intent

Static rendering today mixes two sources: the Wallet's own static presentation and the issuer's `security_hint`. That coupling forces View §5.4: locale selection over issuer metadata, fallback to dynamic rendering when the selected tag is `default` or a language the Wallet cannot render statically, and a two-branch `display_locale` rule. Proof Verify mirrors it.

Simplify by separating the sources cleanly:

- If a transaction data type's rulebook has a Static Presentation section, the type is **static**: the Wallet renders it statically, exactly as the rulebook defines, and uses **no** issuer-provided display data.
- Everything shown on a static screen — labels, title, action labels, an optional security hint, and their translations — comes from the rulebook.
- All other types stay dynamic, unchanged.

## Goals

1. The rendering mode is a property of the transaction data type, not a Wallet choice.
2. A static presentation depends on the rulebook only. No issuer `display`, `ui_labels` or `security_hint` is used.
3. The Static Presentation section defines the display strings per language and a fallback language, including an optional security hint.
4. View §5.4 and the static branch of Verify reduce to a few lines with no fallback path.

## Non-goals

- Changes to dynamic rendering, value types, or dynamic locale selection (View §2–§4 content).
- Changes to ad-hoc metadata for types without a rulebook.
- Rulebook-defined layout. The Wallet keeps its own layout within the rulebook's display obligations.

## Anti-goals

- Any residual path where issuer data influences a static screen.
- A fallback from static to dynamic for static types (no two paths for one type).
- Dropping any View §2 safeguard that today applies to static rendering (full display before confirm, no truncation, value-type formatting, directional characters, displayed-claim limit).
- Dangling references to `render_mode`, Wallet mode selection, or the static `security_hint` exception.

## Approaches considered

- **Strict (chosen by the user).** A type with a Static Presentation section is always rendered statically. A Wallet that does not implement that rulebook treats the entry as not compatible. One path per type; issuer display metadata for such types becomes irrelevant.
- **Fallback.** Static where the Wallet can, otherwise dynamic from issuer metadata. Rejected: keeps two paths and the issuer labels for the same type, which is the complexity being removed.
- **Wording by the Wallet (option A, meaning-only rulebook).** Initially picked for the hint, then superseded by the user: localisation is provided by the rulebook.

## Decisions

### Agreed with the user

- **Strict static.** If the rulebook of an entry's type contains a Static Presentation section, the Wallet **SHALL** render the entry statically per that section. If the Wallet does not implement that rulebook (exact type identifier and version), the entry is not compatible.
- **Rulebook is the only source of static display text,** including localisation. Issuer `display`, `ui_labels` and `security_hint` are not used in static rendering.
- **Security hint in static rendering** exists only if the rulebook's Static Presentation section defines one; otherwise none is shown.

### My calls (presented, not vetoed)

1. **Language selection.** The Static Presentation section lists its languages ([RFC5646] tags) and designates one fallback language. The Wallet applies the [RFC4647] Lookup of View §4 step 1 against the rulebook's tags; if nothing matches, it uses the fallback language. A static entry is never incompatible for language reasons. `display_locale` is the selected rulebook tag; never `default`.
2. **`render_mode` is removed** from the proof (Core §6.1, §6.3, examples; Verify; Risk Signals; Log; Payment; index; changelog). The mode follows from the type. It was introduced in draft-3, so nothing to migrate.
3. **Issuer metadata for static types.** The type is still listed in the credential's `transaction_data_types` — that is how a credential declares support, and `metadata_integrity` still identifies that JWT. For such a type, `claims` and `ui_labels` are **OPTIONAL** (the value may be an empty object) and the Wallet **SHALL** ignore them. The `payload` conforms to the rulebook.
4. **Ad-hoc metadata** on an entry of a static type makes it not compatible.
5. **Payment rulebook** gets strings in English, German and French; English is the fallback. Strings: transaction title, labels for `amount` and `payee.name` (and `payee.logo` alt/label if needed), affirmative and denial action labels. No security hint for Payment unless the builder finds an existing need (my call: none).
6. **Strings are fixed text.** The Wallet displays the rulebook strings exactly; they are subject to the length and character constraints of Proof Metadata §3.3 (rulebook authors must comply). Value formatting (amount, dates) stays per `value_type` and the Wallet's locale formatting for the selected language.

## Change list

1. **PaSO Core** (`paso-core.md`)
   - §5.3: Static Presentation section **SHALL** additionally define the display strings per language (title, labels of displayed claims, action labels, optional security hint) and a fallback language. Reconcile with the existing "rulebook MAY define localised UI labels" sentence. A rulebook with a Static Presentation section makes the type static: see View §5.
   - §6.1 / §6.3: remove `render_mode`; `display_locale` description covers static (selected rulebook tag) and dynamic (unchanged).
   - Examples (A.x): remove `render_mode`.
   - Any §7 text referring to mode choice or render_mode: adjust (e.g. §7.5 compatibility — a static type whose rulebook the Wallet does not implement, or that carries ad-hoc metadata, is not compatible).
2. **PaSO View** (`paso-view.md`)
   - §2 line 31 and 35: drop "including the `security_hint` where present" wording where it now ambiguously covers static; §2 stays the dynamic definition.
   - §4: applies to dynamic rendering only; static language selection is in §5.4.
   - §5.1 → "Applicability": a type is static iff its rulebook has a Static Presentation section; Wallet SHALL render statically; not implementing the rulebook or ad-hoc metadata → not compatible.
   - §5.2 → remove mode selection; keep that the credential metadata is still retrieved and verified and that the type must be listed, with `claims`/`ui_labels` ignored.
   - §5.3: Wallet displays the rulebook's strings exactly; no issuer data; security hint only if the rulebook defines one. §2 safeguards list unchanged.
   - §5.4: language selection per call 1; `display_locale`.
   - §1.1 overview and §6 security considerations: adjust if they reference Wallet choice or `security_hint` in static mode.
3. **Proof Metadata** (`paso-proof-metadata.md`)
   - §3: `claims` and `ui_labels` OPTIONAL and ignored for static types.
   - §3.1 / §3.2: remove the `security_hint` static exception; static types use rulebook strings per View §5.
   - §3.3: note that rulebook static strings follow the same constraints (or put that in Core §5.3).
4. **Proof Verify** (`paso-proof-verify.md`)
   - Remove `render_mode` check. `display_locale`: if the type is static (rulebook has a Static Presentation section), verify it is one of the rulebook's language tags; otherwise the existing dynamic check. Static type with ad-hoc metadata → fail.
5. **Risk Signals, Log** — remove `render_mode` from examples/text; Log replay of a static presentation reconstructs from rulebook + `display_locale`.
6. **Payment rulebook** (`Payment.md`)
   - §3: languages, fallback, strings table; actions reference the strings.
   - A.1 (dynamic example): Payment is now static, so A.1's issuer `display`/`ui_labels` are no longer used for rendering. Rework A.1/A.2 so the examples show the static screen in the selected language and the metadata entry that declares support. Builder decides the cleanest arrangement.
   - A.2: French screen with rulebook strings; `display_locale: "fr"`; no `render_mode`.
7. **Overview** (`index.md`, `README.md` if affected) — "Security hints, when provided, must be shown exactly" → applies to dynamic rendering, or rulebook hint in static; rendering-modes section: static is mandatory for static types.
8. **Changelog** (`docs/changelog.md`) — rewrite the static rendering entries (lines ~32, 63, 110, 129 and any `render_mode` mention) to the new rule, per role.

## Verification

- `rg -n "render_mode" docs README.md` → no hits.
- `rg -n -i "security_hint" docs` → only dynamic-rendering and metadata-definition hits; none in View §5, Verify static branch, Payment A.2.
- `rg -n -i "selects the rendering mode|cannot require or prohibit static|use dynamic rendering instead" docs` → no hits.
- `make build` (strict mkdocs) succeeds without broken-link warnings.
- Section cross-references to View §5.x still resolve to the intended content.

## Left to the builder

- Exact wording in the existing spec style (RFC 2119 keywords, reference tables).
- Exact Payment strings in en/de/fr within the §3.3 limits.
- Whether the strings live as a table in Payment §3 or a subsection §3.3 "Strings".
- Arrangement of Payment Annex A examples.
## Amendment (2026-11-27, after implementation)

Call 3 is replaced at the user's direction: for a type whose rulebook contains a Static Presentation section, the credential metadata entry **SHALL** be an empty object (`claims` and `ui_labels` **MUST NOT** be present). The issuer does not compensate for Wallets that lack the rulebook; such a Wallet finds no claims metadata, so the entry is not compatible (Core §7.5 condition 3). This makes the strict rule enforceable without the Wallet knowing rulebooks it does not implement. Consequence for Payment: Attestation Providers can no longer add internal payload claims; the `payload` contains exactly the rulebook's claims.
