# PaSO Static-Only Rendering for Static Types Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A transaction data type whose rulebook has a Static Presentation section is always rendered statically, from rulebook-defined strings and languages only; no issuer display data (`display`, `ui_labels`, `security_hint`) is used, and `render_mode` is removed.

**Architecture:** Markdown spec edits on `draft-3`, one commit per task. "Tests" are `rg` checks for leftover or missing wording plus the strict MkDocs build (`make build`), which fails on broken links.

**Tech Stack:** MkDocs Material via `uvx`; `make build` = `mkdocs build --strict`.

**Spec:** `superpowers/specs/2026-11-27-paso-static-only-design.md`

## Global Constraints

- Baseline: `make build` exits 0 on `draft-3` at `750cdee`. Every task leaves it at exit 0; run `rm -rf site` afterwards.
- Spec style: RFC 2119 keywords in `**BOLD**`; `[Reference]` names resolved in each file's references table; annexes informative.
- Terms, exactly: "static rendering", "dynamic rendering", "Static Presentation section", "static type" is **not** introduced as a defined term — say "a transaction data type whose rulebook contains a Static Presentation section".
- Do not renumber sections. View keeps §5.1–§5.4 (titles may change); Core keeps §6.1–§7.5.
- No editorial changes beyond this feature.
- Payment strings (exact copy, used in Payment §3, Payment Annex A, Core A.4):

  | Element | `en` (fallback) | `de` | `fr` |
  |---|---|---|---|
  | Transaction title | Confirm Payment | Zahlung bestätigen | Confirmer le paiement |
  | `amount` label | Amount | Betrag | Montant |
  | `payee.name` label | Payee | Zahlungsempfänger | Bénéficiaire |
  | `payee.logo` label | Payee logo | Logo des Zahlungsempfängers | Logo du bénéficiaire |
  | Affirmative action | Pay | Bezahlen | Payer |
  | Denial action | Cancel | Abbrechen | Annuler |

  No security hint for Payment.
- Dynamic example type replacing `urn:paso:sca:global:payment:1` wherever an example relies on issuer `display`/`ui_labels`: `urn:paso:sca:com.example.bank:transfer:1` (same claims as today's payment examples).

## Review Focus

1. **Verify rejects valid static proofs.** `display_locale` for a static type must be checked against the rulebook's language tags, not against metadata arrays (which may be absent). Task 4 Step 1 grep + re-read against View §5.4.
2. **Core §7.5 condition 3 fails static entries.** Conformance today is against claims metadata, which is now optional for static types; a `{}` entry would make every Payment payload non-conforming. Condition 3 must use the rulebook for such types. Task 2 Step 1 grep.
3. **Metadata §3 rules that invalidate `{}` entries.** `claims` REQUIRED, `ui_labels` REQUIRED, §3.1 "MUST supply metadata for each claim", §3.3 same-locales rule — each must exempt types whose rulebook has a Static Presentation section. Task 3 Step 1 grep.
4. **Examples that contradict the rule.** No example may show `global:payment:1` rendered from issuer `display`/`ui_labels`, carry ad-hoc metadata for it, or report `render_mode`. Metadata A.4's ad-hoc type must not be listed in A.5's `transaction_data_types`. Task 3 Step 1 + Task 6 Step 1 greps.
5. **Core A.4 / Payment annex screens drift from the rulebook strings.** Every static screen must use the Global Constraints strings verbatim for its language. Task 5 Step 1 grep.

---

### Task 1: PaSO View

**Files:**
- Modify: `docs/specifications/paso-view.md` — §1.1 (line 13), §2 (lines 23, 31, 35), §4 intro (line 148), §5.1–§5.4 (lines 170–202), §6 if it mentions Wallet mode choice.

**Interfaces:**
- Produces: View §5.1 "Applicability" (type with Static Presentation section → Wallet **SHALL** render statically; not implementing rulebook or ad-hoc `metadata` → not compatible), §5.2 "Credential Metadata" (metadata still retrieved/verified; type must be listed; `claims`/`ui_labels`/`security_hint` ignored), §5.3 "Presentation Obligations", §5.4 "Language and `display_locale`". Tasks 2–6 cite these.

- [ ] **Step 1: Edit**
  - §1.1: dynamic rendering for every type whose rulebook has no Static Presentation section; static rendering mandatory for the others, using only the rulebook's presentation and strings.
  - §2 (l.23, l.31, l.35): unchanged — §2 defines dynamic rendering, where the issuer `security_hint` still applies. §5.3 no longer imports the hint rule from §2.
  - §4 intro: "This section applies to dynamic rendering. Language selection in static rendering is defined in Section 5.4."
  - §5.1: as in Interfaces; no "MAY".
  - §5.2: delete mode selection and "cannot require or prohibit"; keep the metadata retrieval sentence; the `payload` conforms to the rulebook; Wallet **SHALL** ignore `claims`, `ui_labels` (incl. `security_hint`) of that type.
  - §5.3: Wallet displays the content the Static Presentation section requires, labelled with the rulebook strings of the language selected per §5.4, exactly as defined; displays the rulebook's security hint if and only if the rulebook defines one; uses no issuer-provided display data; own layout within the display obligations. Keep the §2-safeguards paragraph verbatim.
  - §5.4: single language; Lookup per [RFC4647] Section 3.4 against the rulebook's language tags, priority list in order (as §4 step 1); no match → rulebook's fallback language; report selected rulebook tag in `display_locale`; never `default`; never not-compatible for language reasons.
- [ ] **Step 2: Verify**
  Run: `rg -n -i "security_hint|render_mode|selects the rendering mode|require or prohibit|dynamic rendering instead|MAY\*\* instead use|MAY\*\* render" docs/specifications/paso-view.md`
  Expected: only l.31/l.35-area (§2) hits for `security_hint`; nothing else.
  Run: `make build && rm -rf site` → exit 0.
- [ ] **Step 3: Commit** `git commit -am "docs(view): static rendering is mandatory for static types and uses rulebook strings only"`

### Task 2: PaSO Core

**Files:**
- Modify: `docs/specifications/paso-core.md` — §5.3 (l.118–128), §6.1 table (l.153–154), §6.3 table (l.178), §7.2 (l.196), §7.5 (condition 3 l.271; summary l.285–287), Annex A.2 (l.368), A.3 (l.399), A.4 (l.422–436).

**Interfaces:**
- Consumes: View §5.1–§5.4 (Task 1).
- Produces: Core §5.3 Static Presentation requirements (strings per language, fallback language, optional security hint; strings subject to [PaSO Proof Metadata] Section 3.3 constraints). Task 5 conforms Payment to it.

- [ ] **Step 1: Edit**
  - §5.3: Static Presentation section **SHALL** additionally define: the languages ([RFC5646] tags) and one fallback language; per language, the transaction title, the label of each displayed claim, the affirmative and denial action labels, and optionally a security hint. These strings **SHALL** meet [PaSO Proof Metadata] Section 3.3. A rulebook with this section makes static rendering mandatory per [PaSO View] Section 5. Reconcile the existing "MAY also define the localised UI labels" sentence (it remains for rulebooks without the section, or is folded in).
  - §6.1: delete `render_mode` row; `display_locale` static clause → "per [PaSO View] Section 5.4: the selected language tag of the rulebook, never `default`."
  - §6.3: delete `render_mode` row.
  - §7.2 last sentence: unchanged in meaning (static → View §5.4).
  - §7.5 condition 3: for a type whose rulebook contains a Static Presentation section, the definition of the type is the rulebook: the `payload` conforms if it conforms to the rulebook. Add to the informative summary: step 1 — ad-hoc metadata on such a type → not compatible; step 2 — for such a type the Wallet must implement the rulebook, else not compatible; step 3 → "Types whose rulebook contains a Static Presentation section are rendered statically, all others dynamically ([PaSO View] Section 5.1)."
  - A.2, A.3: remove `render_mode` lines (keep JSON/CBOR-diag valid — check trailing commas).
  - A.4: "How a Wallet displays the transaction from Annex A.1 with static rendering in `en`, using the strings of the Payment rulebook"; screen title "Confirm Payment", labels Amount/Payee, buttons Pay/Cancel.
- [ ] **Step 2: Verify**
  Run: `rg -n "render_mode|selects the rendering mode|Payment Confirmation" docs/specifications/paso-core.md` → no hits.
  Run: `rg -n "Static Presentation" docs/specifications/paso-core.md` → §5.3 and §7.5 hits present.
  Run: `make build && rm -rf site` → exit 0.
- [ ] **Step 3: Commit** `git commit -am "docs(core): rulebook strings for static types, drop render_mode, static compatibility"`

### Task 3: Proof Metadata

**Files:**
- Modify: `docs/specifications/proof/paso-proof-metadata.md` — §3 (l.40–44), §3.1 (l.53ff, l.63), §3.2 (l.77, l.83), §3.3 (same-locales rule), Annex A.2 (l.~320), A.4 (l.382), A.5 (l.448), A.6 (l.498).

**Interfaces:**
- Consumes: View §5.2 (Task 1), Core §5.3 (Task 2).
- Produces: dynamic example type `urn:paso:sca:com.example.bank:transfer:1` in Annex A; View A.1 still points at Metadata A.6 (must stay valid).

- [ ] **Step 1: Edit**
  - §3: `claims` and `ui_labels` REQUIRED except for a type whose rulebook contains a Static Presentation section, for which both are OPTIONAL and ignored by the Wallet ([PaSO View] Section 5.2); its value **MAY** be an empty object.
  - §3.1 "MUST supply metadata for each claim" and l.63: same exemption; l.63 → static rendering uses the rulebook strings, not `display`.
  - §3.2 l.77: "When present, the Wallet **SHALL** display it exactly as provided in dynamic rendering …". l.83: remove the "`security_hint` is an exception" sentence; static types use rulebook strings per [PaSO View] Section 5.3.
  - §3.3: the same-locales/default-entry rule applies to types rendered dynamically.
  - A.2: `urn:paso:sca:global:payment:1` value → `{}`; add `urn:paso:sca:com.example.bank:transfer:1` with today's full payment content. Adjust the prose to say the credential supports Payment (static) and an issuer-defined transfer type (dynamic).
  - A.4: entry `type` → `urn:paso:sca:com.example.bank:transfer:1`.
  - A.5: publishes `urn:paso:sca:global:payment:1` as `{}` (not the transfer type, so A.4's ad-hoc type stays unpublished).
  - A.6: type → `urn:paso:sca:com.example.bank:transfer:1`.
- [ ] **Step 2: Verify**
  Run: `rg -n -B2 -A3 "global:payment:1" docs/specifications/proof/paso-proof-metadata.md` → every hit is `{}` or a prose mention, never followed by `"claims"`/`"display"`.
  Run: `rg -n "is an exception|always be displayed" docs/specifications/proof/paso-proof-metadata.md` → no hits.
  Run: `make build && rm -rf site` → exit 0.
- [ ] **Step 3: Commit** `git commit -am "docs(metadata): static types need no display metadata; dynamic examples use an issuer-defined type"`

### Task 4: Verify, Risk Signals, Log

**Files:**
- Modify: `docs/specifications/proof/paso-proof-verify.md` (l.46–48), `docs/specifications/proof/paso-proof-risk-signals.md` (l.358, l.423), `docs/specifications/proof/paso-proof-log.md` (l.51).

**Interfaces:**
- Consumes: View §5.1, §5.4; Core §5.3, §6.1.

- [ ] **Step 1: Edit**
  - Verify: delete `render_mode` bullet. `display_locale` bullets: "if the applicable Transaction Data Type Rulebook contains a Static Presentation section: verify that it is one of the language tags that section defines, compared case-insensitively ([PaSO View] Section 5.4), and that the `transaction_data` entry does not carry a `metadata` parameter. Otherwise:" + today's dynamic check unchanged.
  - Risk Signals: remove both `render_mode` lines (fix trailing commas).
  - Log l.51: "Where the transaction data type's rulebook contains a Static Presentation section ([PaSO View] Section 5), the replay **SHALL** reproduce the static presentation of the Wallet version identified by `wallet_instance_version`, in the language reported in `display_locale`."
- [ ] **Step 2: Verify**
  Run: `rg -n "render_mode|security_hint" docs/specifications/proof/paso-proof-verify.md docs/specifications/proof/paso-proof-risk-signals.md docs/specifications/proof/paso-proof-log.md` → no hits.
  Run: `make build && rm -rf site` → exit 0.
- [ ] **Step 3: Commit** `git commit -am "docs(proof): verify static display_locale against the rulebook; drop render_mode"`

### Task 5: Payment rulebook

**Files:**
- Modify: `docs/rulebooks/transaction_data/Payment.md` — §3 (l.28–48), Annex A.1 (l.63–160), A.2 (l.161–187).

**Interfaces:**
- Consumes: Core §5.3 (Task 2), View §5.4 (Task 1), Global Constraints strings.

- [ ] **Step 1: Edit**
  - §3 intro: Payment is always rendered statically per [PaSO View] Section 5.
  - New §3.3 "Strings": languages `en`, `de`, `fr`; fallback `en`; table = Global Constraints table; "No security hint is defined."
  - §3.2 Actions: labels per §3.3; drop "(e.g., "Pay")".
  - A.1: metadata entry → `{ "urn:paso:sca:global:payment:1": {} }` with one line explaining no display metadata is needed; screen in `en` using §3.3 strings (keep logo block, label "Payee logo"); drop the "renders, in claim order" sentence if it implies metadata-driven order.
  - A.2: "Static Rendering in French": Wallet priority list `fr`; Lookup selects `fr`; screen uses French strings incl. "Bénéficiaire" label for Acme Store, title "Confirmer le paiement", buttons Annuler/Payer; JSON shows only `"display_locale": "fr"`; remove security_hint sentence.
- [ ] **Step 2: Verify**
  Run: `rg -n "render_mode|security_hint|\"display\"|ui_labels|e\.g\., \"Pay\"" docs/rulebooks/transaction_data/Payment.md` → no hits.
  Run: `rg -c "Confirmer le paiement|Zahlung bestätigen|Confirm Payment" docs/rulebooks/transaction_data/Payment.md docs/specifications/paso-core.md` → Payment ≥3, Core ≥1.
  Run: `make build && rm -rf site` → exit 0.
- [ ] **Step 3: Commit** `git commit -am "docs(payment): rulebook strings in en/de/fr; examples show static rendering only"`

### Task 6: Overview and changelog

**Files:**
- Modify: `docs/index.md` (l.107, l.135, §6 l.143–166), `docs/changelog.md` (l.21, 27, 32, 63, 74, 82, 89, 95, 110, 129, 146), `README.md` only if a hit appears.

**Interfaces:**
- Consumes: all earlier tasks.

- [ ] **Step 1: Edit**
  - index l.107: "the locale that was actually shown to the user and the wallet's version" (rendering mode follows from the type).
  - index l.135: "Security hints are shown exactly as provided — by the issuer in dynamic rendering, by the rulebook in static rendering."
  - index §6: two modes by type, not by wallet choice. §6.1: static rendering is mandatory for types whose rulebook defines a Static Presentation; the rulebook fixes what is shown and the strings in its languages; wallet chooses layout; issuer display data is not used; a wallet that has not implemented the rulebook cannot process that type. Remove `render_mode`. §6.2 last paragraph: dynamic rendering stays mandatory for every type without a Static Presentation.
  - changelog: rewrite each listed entry to the new rule per role (Wallet: render static types statically from rulebook strings, no issuer data, language Lookup + fallback, not compatible without the rulebook or with ad-hoc metadata; Attestation Provider: static types may be listed as `{}`, issuer `security_hint` is not shown for them; Authorizing Party: no `render_mode`, static `display_locale` against rulebook tags; Rulebook authors: Static Presentation now defines strings, languages, fallback, optional hint). Delete `render_mode` entries (l.21 first sentence, l.89) instead of rewording them.
- [ ] **Step 2: Verify (whole branch)**
  Run: `rg -n "render_mode" docs README.md` → no hits.
  Run: `rg -n -i "security_hint" docs` → hits only in View §2, Metadata §3.2/§3.3/annex, changelog/index wording that limits it to dynamic rendering.
  Run: `rg -n -i "selects the rendering mode|require or prohibit static|use dynamic rendering instead|optional optimisation|may show a purpose-built" docs` → no hits.
  Run: `rg -n -A4 "global:payment:1\"?: *\{" docs | rg -n "\"display\"|ui_labels"` → no hits.
  Run: `make build && rm -rf site` → exit 0.
- [ ] **Step 3: Commit** `git commit -am "docs: overview and changelog for static-only rendering of static types"`