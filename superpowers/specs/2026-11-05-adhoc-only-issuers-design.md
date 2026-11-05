# Design: Issuer-reserved transaction data types (ad-hoc only, audience-bound)

Status: approved
Branch: `feat/adhoc-issuer-reserved-types`, based on `feat/no-locale-mixing`
(PR #7). It depends on PR #7's locale-selection wording (View §4,
Metadata §4/§5.4/§6, Annex A.6).
Target: `docs/specifications/proof/paso-proof-metadata.md`,
`docs/specifications/proof/paso-proof-verify.md`

## Intent

Main use case: a bank acts as both Attestation Provider (Issuer) and
Relying Party. It wants to use transaction data types for its own
transactions **without publishing them** in its signed credential
metadata. Third-party Relying Parties shall only be able to use the types
the bank publishes.

The ad-hoc channel (Section 5) already lets a verified JWT introduce types
absent from stored metadata (§5.4). Two things are missing:

1. Explicit permission to publish an empty, or partial,
   `transaction_data_types`.
2. A way to bind an ad-hoc JWT to a specific RP. Today an ad-hoc JWT is a
   bearer object, usable by any RP holding it until `exp`.

## Goals

- An Issuer MAY publish `transaction_data_types` as `{}` or as any subset
  of the types it uses.
- **Published types** are usable by any RP, including the Issuer itself,
  with or without ad-hoc overrides. This is unchanged.
- **Unpublished types** are usable only through an ad-hoc JWT.
- **Every ad-hoc JWT** is audience-bound to exactly one RP chosen by the
  Issuer, whether it introduces an unpublished type or overrides a
  published one.
- No change to the trust model or Core. Verify and Risk Signals each get
  one clarifying sentence (changes 8 and 9).

## Non-goals

- Making `credential_metadata_uri` optional. It stays a SHALL (§2).
- Defining how an RP obtains ad-hoc JWTs. This stays out of scope (§5.1);
  in the main use case it is internal to the bank.
- The Wallet checking "RP identity == Issuer identity" directly.
- A new Issuer-side "ad-hoc only" flag.

## Anti-goals

- A third party using an unpublished type by replaying a copied ad-hoc JWT.
- Restricting the Issuer's own use of published types.
- Breaking the risk-signal encryption key source (`paso-proof-risk-signals.md`
  §7.3) or credential display, both of which rely on the signed metadata JWT.

## Approaches

**Metadata side:**
- **Chosen:** keep the URI and the signed JWT, and allow empty or partial
  `transaction_data_types`.
- **Rejected:** an optional URI plus an `adhoc_only` flag. It leaves mdoc
  without a source for the encryption key and for display, and touches
  §2, §3, §6, §7 and §8.

**Restricting use of unpublished types:**
- **A, informative only (rejected):** a leaked JWT is reusable until `exp`.
- **B1, REQUIRED only for unpublished types (rejected):** the Wallet would
  have to check stored metadata to decide whether `aud` is needed, and
  overrides of published types would stay replayable.
- **B2, chosen:** an `aud` claim, a single string, REQUIRED on every ad-hoc
  JWT and equal to the RP's OID4VP `client_id`. This is one rule with a
  plain equality check. Cost: a breaking change for existing ad-hoc JWTs
  (acceptable in draft), and the Issuer mints one JWT per RP.
- **Rejected:** the Wallet matching RP identity against Issuer identity.
  This is heavy and fragile across identifier schemes, and it breaks the
  §1 use of handing updated metadata to partners.

## Changes (1–7 in `paso-proof-metadata.md`, 8 in `paso-proof-verify.md`, 9 in `paso-proof-risk-signals.md`)

1. **§3, `transaction_data_types`:** the object **MAY** be empty and **MAY**
   omit types the Issuer uses. A type absent from it is supported only via
   a valid ad-hoc JWT (§5.4). An entry without `metadata` for such a type is
   unsupported per [PaSO Core] Section 7. Add an informative sentence:
   types intended for third-party RPs should be published.
2. **§3, one sentence:** with `{}`, locale selection for the credential
   metadata (as referenced in §4 and §6) **SHALL** be treated as
   succeeding. This removes the vacuous-case ambiguity in [PaSO View]
   Section 4 and prevents §6 from blocking all PaSO operations. It is
   placed in §3 so that the lines PR #7 rewrote (§4 line 134, §6 line
   212) stay untouched.
3. **§5.2, new claim `aud`:** **REQUIRED** (string). The `client_id` of
   the single RP permitted to use this JWT, per [OID4VP]. It narrows
   [RFC7519] Section 4.1.3: arrays **SHALL NOT** be used.
4. **§5.3, new verification step:** verify that `aud` is a string equal
   to the `client_id` of the OID4VP request carrying the `transaction_data`
   entry. On failure, the existing rule applies: the entry is
   incompatible and there is no fallback.
5. **§5.4:** state that `metadata_integrity` is absent from the proof when
   ad-hoc metadata was used for the transaction. This is consistent with
   Core: "REQUIRED when a signed credential metadata JWT was used".
6. **§5.5 (informative):** explain Issuer-reserved types. `aud` turns the
   ad-hoc JWT from a bearer object into an RP-bound one, and a short `exp`
   further limits replay by the same RP. Describe the bank-as-issuer-and-
   verifier case.
7. **Annex A:**
   - A.4/A.5: add `aud` to both example payloads.
   - New A.7: a signed credential metadata JWT payload with
     `"transaction_data_types": {}` that still carries `display` and
     `risk_signals_encryption_keys`.

8. **Verify, step 4 (SCA response claims verification):** add a separate
   sentence, rather than editing the `display_locale` line (line 46):
   - Where step 4 refers to the credential metadata of the matched
     transaction data type, the Authorizing Party **SHALL** use the ad-hoc
     metadata carried in the `transaction_data` entry's `metadata`
     parameter when it is present.
   - The Authorizing Party **SHALL** first verify that JWT per [PaSO Proof
     Metadata] Section 5.3, with the Authorization Request's `client_id`
     as the expected `aud`. The Authorizing Party need not be the RP,
     because the proof package may be forwarded through the ingestion
     endpoint.
   - Without this, the `display_locale` check fails for unpublished
     types, which is exactly the bank's own use case. It also fixes the
     same pre-existing gap for ad-hoc overrides of published types.

9. **Risk Signals §4.1 (one paragraph):** Risk Signals reads the per-type
   declarations `risk_signal_profiles` and `risk_signals` (§4.1 lines 124
   and 129) and `encrypted` (§7.2 line 221) from "the signed credential
   metadata". When a valid ad-hoc JWT is present, these declarations come
   from its `metadata` object instead, per Metadata §5.4. The issuer
   encryption key (§7.3) is credential-level and stays unaffected.

## Unchanged, verified

- `paso-core.md`: the `metadata_integrity` semantics already allow
  absence.
- `paso-proof-verify.md` (line 45) handles `metadata_integrity` as "if
  present". Only the `display_locale` metadata source needs change 8.
- `paso-proof-risk-signals.md` §7.3: the encryption key still comes from
  the signed JWT.

## Left to the builder

- Exact wording and placement.
- The precise `client_id` value to compare, including any client
  identifier prefix scheme in OID4VP. Use the value exactly as it appears
  in the request, with string equality.
- Add [RFC7519] to §9 References; it is not referenced yet. `client_id`
  is not used anywhere in this module yet, so reference [OID4VP] for it.