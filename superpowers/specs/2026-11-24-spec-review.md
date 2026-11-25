# PaSO Spec Review: Ambiguities and Inconsistencies

**Date:** 2026-11-24
**Scope:** All documents under `docs/` — `index.md`, `paso-core.md`, `paso-view.md`, `proof/paso-proof-metadata.md`, `proof/paso-proof-verify.md`, `proof/paso-proof-log.md`, `proof/paso-proof-risk-signals.md`, `proof/paso-proof-risk-signal-registry.md`, `rulebooks/transaction_data/Payment.md`, `rulebooks/risk_profiles/Default.md`.
**Reviewed at commit:** `192ef7d`
**Resolved:** #1 and #2 — `amr` is an ordinary risk signal; SCA comes from holder binding per the Credential Rulebook (design `2026-11-24-paso-amr-not-sca-design.md`, commits `2202bbe`..`de2805a`). Editorial items in C, and the example fixes in #17 and #20, in `64c079c`. #3 — the advanced profile is optional; the simple profile has an exact boundary and shares entry compatibility (Core §7.5) (design `2026-11-24-paso-optional-advanced-profile-design.md`, commits `c4b2b28`..`4684c05`). #4 — Wallets check rulebooks only where they implement them, otherwise metadata; role obligations in Core §5.5; ad-hoc-only types need no rulebook (design `2026-11-24-paso-rulebook-checks-design.md`, commits `8a9e5cd`..`ebe3866`). #9 — ad-hoc metadata only for types the signed metadata does not list, enforced by the Wallet and checked by the Authorizing Party; RPs keep ad-hoc metadata consistent with any rulebook (design `2026-11-25-paso-adhoc-unpublished-only-design.md`, commits `b6f3156`..`4f08975`). #10 — the ingestion endpoint is a proposal a payment scheme or rulebook may replace; its envelope is always a signed JWT with `x5c`, optionally nested in a JWE; `401` means the signature, `typ` or chain failed (design `2026-11-25-paso-verify-envelope-design.md`, commits `b5ed51c`..`30fdfc5`).
**Next up:** #11 — hashes for multiple entries (Core §6.1 defines a singular `transaction_data_hash`; OID4VP's `transaction_data_hashes` is not mentioned; Verify §3 step 4 does not say which entry applies). Deferred minors so far: Core §6.1 omits optional risk signals (#23); View §5.2 limits per-credential `render_mode` differences to the advanced profile. From the #4 final review: Core §5.1 "a type used only with ad-hoc metadata" is a usage property no party can test (suggest "no rulebook is published and the type is used only with ad-hoc metadata"); Verify §3 step 5 cites all of Core §7.5 condition 3, including the Wallet-only "formatting directives supported" clause; `index.md` l.189, 209 and 237 still say the Wallet validates against "rulebook and signed metadata"; Core §5.5 Authorizing Party bullet omits ad-hoc-only types (Verify §3 step 5 covers them). From #9: Metadata §5.4 `metadata_integrity` bullet names only "step 3 of Section 5.3" (step 5 runs against the same JWT; "steps 3 and 5" would be exact); `index.md` §6.2 frames ad-hoc metadata as for "types that have no rulebook", but the rule is now "types the issuer does not publish". From #10: Verify §4.3 processing answers a body that is neither a JWS nor a JWE with `401` at step 2, not the `400` "malformed" of §4.2.
**Handoff (2026-11-25):** #10 done (commits `b5ed51c`..`30fdfc5`). Nothing pushed: `draft-3` is ahead of `origin/draft-3`. Process per finding so far: brainstorm → short design in `superpowers/specs/` → plan in `superpowers/plans/` → inline execution with grep RED/GREEN and `.venv/bin/mkdocs build --strict -d /tmp/paso-site`.

Findings are ordered by impact. References use the form `file §section`. OID4VP/OID4VCI section numbers and the claim that OID4VP requires `transaction_data_hashes` were not checked against the published documents.

## A. Contradictions between documents (highest impact)

1. **The SCA evidence claimed in the intro is not delivered by the specs.**
   - `index.md` §4.1, §7.1, §7.2, §9.1 and §9.7 describe `amr` as a required proof claim that spans ≥2 factor categories.
   - `paso-core` §6.1 says the opposite: `amr` is not a claim and "this specification does not require it."
   - The global `Payment.md` rulebook references no risk profile and no `amr` requirement. `Default.md` explicitly excludes `amr`.
   - So `urn:paso:sca:global:payment:1` produces no factor evidence by default. Verify §3 step 6 checks `amr` "against the rulebook," but the Payment rulebook defines no such requirement.

2. **The Default profile and SCA cannot be combined safely.**
   - `Default.md` sets `encrypted: true`. Risk Signals §7.2 says encryption applies if *any* source requires it.
   - So once an ecosystem adds an `amr`-requiring profile (as Registry §2.8 mandates for SCA), `amr` is encrypted. A non-issuer Authorizing Party then cannot check it.
   - That is exactly the problem §7.8 warns about. `Default.md` claims "the caution … does not arise," which only holds when the profile is used alone.

3. **Is the advanced profile optional or mandatory?**
   - `paso-core` §7.4 says Wallets **MAY** implement it.
   - `paso-view` §1.1 says a Wallet implementing View **SHALL** support it.
   - View and the intro both make dynamic rendering mandatory for every Wallet. In effect the advanced profile is mandatory and the simple profile serves no purpose.
   - Separately, §7.3 says the Wallet "**MAY** reject non-trivial credential sets," while §7.4 says it "**SHALL** reject." "Non-trivial" is never defined.

4. **Rulebook availability vs. Wallet conformance checks.**
   - `paso-core` §5.1 says every type **SHALL** have a published rulebook. `index.md` §6.2 says ad-hoc metadata serves "types without a published rulebook."
   - More fundamentally, the Wallet is asked to act on rulebook contents it has no machine-readable way to obtain:
     - `paso-core` §7.3 step 2 and §7.4.2 step 2 require checking the payload against "fields not declared by the rulebook."
     - Risk Signals §4.1 and §7.2 require applying rulebook-referenced profiles, rulebook enumerations and rulebook encryption mandates.
   - This cannot work for dynamically rendered types. The spec needs to say either that metadata is the machine-readable projection of the rulebook, or that rulebook checks belong only to the Authorizing Party.

5. **The Authorizing Party cannot reliably check `metadata_integrity`.**
   - Verify §3 step 4 compares it against the issuer's "*current*" metadata JWT. That JWT is not part of the proof package.
   - Several things make "the" JWT ambiguous:
     - The JWT is locale-dependent (Metadata §2, via `Accept-Language`).
     - The Wallet may hold several JWTs per credential (§6).
     - The JWT rotates (§4).
   - The same ambiguity affects the `display_locale` and ad-hoc authorisation checks, and the Wallet's own choice of which JWT to use for locale selection and `adhoc_metadata_clients`.

6. **Ad-hoc metadata storage vs. logging.**
   - Metadata §5.4 says the Wallet **SHALL NOT** persist ad-hoc metadata.
   - Log §3 says the Wallet **SHALL** store the Authorization Request "as received," which contains that metadata. Replay (Log §5) also needs it.

7. **Metadata expiry vs. unlinkability.**
   - Metadata §6: if a stored JWT fails verification on load (e.g. expired), the Wallet must re-fetch it and cannot proceed until it has a valid one.
   - Metadata §8: the Wallet **SHALL NOT** fetch immediately before or after a presentation.
   - At transaction time these two rules cannot both be met.

8. **Metadata members are referenced but never defined.**
   - Risk Signals, Verify and `Default.md` attribute `risk_signal_profiles`, `risk_signals` (the enumeration), `encrypted` and `risk_signals_encryption_keys` to the Metadata module.
   - The Metadata module defines none of them. `risk_signals_encryption_keys` appears only in its example A.7.
   - The enumeration entry schema is also undefined. Risk A.4 omits `required`, so there is no stated default.

9. **Ad-hoc metadata can weaken the issuer's risk configuration.**
   - Risk §4.1 replaces the signed `risk_signal_profiles`, `risk_signals` and `encrypted` with values from the ad-hoc metadata.
   - An authorised Relying Party can therefore drop required signals, or disable the encryption that §7.1 says exists to protect data from Relying Parties.
   - If unintended, this should be a ratchet or union rather than a replacement.

10. **The Verify §4.3 envelope is under-specified.**
    - A JWE is not "signed"; this needs nested JWS-in-JWE.
    - The header that carries `x5c` is unspecified.
    - How a Relying Party is authenticated for the `401` response, when the request is unencrypted, is undefined.

## B. Ambiguities in processing rules

11. **Hashes for multiple entries.**
    - Core §6.1 defines a singular `transaction_data_hash`.
    - OID4VP's KB-JWT `transaction_data_hashes`, which OID4VP requires when `transaction_data` is present, is never mentioned. The Core A.2 example omits it.
    - Verify step 4 ("recompute from *the* entry") does not say which entry applies when there are several.

12. **Two different selection models.**
    - Core §7.4.1 describes multiple independent slots. §7.4.2 describes "exactly one entry for *the* selected credential."
    - If one alternative contains two PaSO credentials, it is unclear whether both entries are shown on one screen. View §4 requires a single locale per screen, while `render_mode` and `display_locale` are reported per credential.
    - `∅` is not mapped to DCQL constructs.

13. **What gets excluded on failure is inconsistent.**

    | Source | Failure | Consequence |
    |---|---|---|
    | View §4 step 3 | Locale selection fails | Exclude the *credential* |
    | Metadata §5.4 | Ad-hoc locale selection fails | *MAY* treat the entry as incompatible |
    | Core §7.4.2 step 2 | Duplicate member names | Reject the *request* |
    | Risk §7.3 | No encryption key | "Cease processing" |

    Excluding at credential level breaks the versioned fallback in Core A.7. Core §7.2 also omits the "no default entries → exclude" case.

14. **Display order.**
    - View §2 says display order equals the order of the `claims` array.
    - The wildcard rule (step 1) renders all non-wildcard claims first, which moves a claim declared after an array group ahead of it.

15. **Images: shown, required, or optional?**
    - View §2: every claim with a `display` array must be displayed before confirmation.
    - The `image` value type says the user is "not required to view" images.
    - Yet a failed image fetch makes the whole entry incompatible (Core §7.4.2 step 3). An informational logo can therefore block a payment, even in static mode where the logo is omitted (Payment A.2).

16. **Value-type extensibility.**
    - Metadata §3.1 allows rulebooks to define new value types.
    - View §3 makes any value type the Wallet doesn't support incompatible. This defeats generic rendering.

17. **Value formats are under-specified.**
    - `iso_currency_amount`: undefined for 0-decimal currencies (e.g. JPY) and negative amounts.
    - Metadata A.4 uses `"EUR 45.00"`, which is the wrong order.
    - `iso_date` / `iso_time` / `iso_date_time`: no ISO 8601 profile, and no rule for which time zone to display.

18. **UI labels.**
    - `affirmative_action_label` is never REQUIRED. Core §5.3 says "MAY … at minimum."
    - A Wallet-supplied `denial_action_label` or title may be in a different language from the metadata locale, which conflicts with the single-language rule.

19. **`mandatory` has a different meaning.** OID4VCI uses it to mean "the issuer always includes this claim." PaSO uses it as "required in the payload" without ever redefining it.

20. **Payment rulebook vs. its examples.**
    - Claim requirements:
      - `transaction_id` is `mandatory: false` in the rulebook, but `true` in Metadata A.2, A.4 and A.6.
      - The rulebook says to use the claims "exactly," yet Metadata A.5 declares only `amount`. A payload containing `payee` then fails Core §7.4.2 step 2.
    - Payee identification:
      - `payee.id` is "tax ID or registry number" with no discriminator. The examples use a SEPA creditor ID, an IBAN, and a VAT-style ID.
      - No payee account is identified, which matters for dynamic linking.
    - Display:
      - Static rendering requires amount and payee on the same screen as the affirmative action; dynamic rendering does not.
    - Normative language:
      - The rulebook uses lowercase "must" in normative statements.

21. **Role relationships in the third-party flow.**
    - It is unstated whether the Authorizing Party is, or may differ from, the Attestation Provider.
    - Risk §6.1 assumes it may differ. The intro says it is the issuing bank.
    - A non-issuer Authorizing Party cannot complete Verify step 6, yet "if any check fails, reject."
    - The Authorizing Party definition ("receives the package from the RP") does not fit the first-party flow.

22. **mdoc gaps.**
    - Which certificate signs metadata. The DS certificate has a restrictive EKU, and Metadata §7 step 4 checks `iss` against an issuer identifier, which mdocs don't carry.
    - How a `COSE_Key` is embedded in JSON metadata.
    - Which COSE algorithm IDs "equivalent ECDH-ES" means, and `COSE_Encrypt` vs `COSE_Encrypt0`.
    - The CBOR table in Risk §5.2 has no boolean or integer row, needed for `active_in_window`, `screenshot_count` and `window_ms`.
    - The Core §6.3 type "array of maps" contradicts the encrypted case.

23. **When `risk_signals` may appear.** Risk §4.2 says it "**MAY** omit" when no signal is required, which implies optional-only arrays are allowed. Core §6.1 and Risk §5 say "absent otherwise."

24. **Gaps in the Verify checklist.**
    - Not checked: KB-JWT `nonce`, `aud` and `iat` against the request; that the presented credential matches the entry's `credential_ids`; that the type is supported by the credential's metadata.
    - `jti`: the replay cache is only SHOULD, with no window.
    - The meaning of `200` ("accepted" vs. "authorised") is unclear.
    - `response_mode` "as defaulted" is not reflected in the check.

25. **Log gaps.**
    - Abandoned sessions record no credential choices, yet §5 promises replay with "the choices that were chosen."
    - No retention period or at-rest protection is specified.
    - It is unclear whether the encrypted or plaintext `vp_token` should be stored.
    - §5 contains a SHALL nested inside a SHOULD.

26. **URNs.**
    - The mdoc namespace `urn:paso:sca:1` itself matches the `urn:paso:sca:` type prefix.
    - Case sensitivity is not defined (RFC 8141 treats the NID as case-insensitive).
    - `paso` is not a registered NID.

## C. Editorial

- `index.md` §1.1: the OpenID4VCI and OpenID4VP links are **swapped**.
- `index.md` §2 lists a "status backchannel" and a "trust module," which do not exist. It omits the Risk Signals module and the Registry.
- `index.md` §4.1 says metadata integrity is "when applicable"; Core says it is always required.
- Core §7.4.1: the paragraph explaining the "first-match rule" sits before the section that defines it (§7.4.2). Core §7.4.1 also uses lowercase "must" and "should never."
- Metadata §8: "invalid per Section 6" should read Section 7.
- Metadata §2: `credential_metadata_uri` is marked OPTIONAL, but the next paragraph says SHALL.
- Core §7.3 step 4 ("proceed") and §7.4.2 step 7 ("MAY proceed") use different normative strength. Neither mentions user authentication.