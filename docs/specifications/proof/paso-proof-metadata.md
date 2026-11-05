# Metadata Module

## Abstract

This document specifies how Attestation Providers serve verifiable credential metadata for PaSO Credentials, and how Wallets retrieve, verify, store, and renew it. It defines the `credential_metadata_uri` extension to [OID4VCI], the signed credential metadata JWT format, the `transaction_data_types` structure within credential metadata, and the claims metadata structure used to describe transaction data payloads. It further defines an ad-hoc mechanism by which the same transaction data type metadata can alternatively be supplied within a `transaction_data` entry itself, by a Relying Party that the credential's issuer authorises in the signed credential metadata.

## 1 Introduction

### 1.1 Overview

[OID4VCI] serves credential metadata as unsigned JSON from the Credential Issuer Metadata endpoint. Unsigned metadata cannot be used as evidence in dispute resolution, and the Wallet cannot verify that it has not been tampered with. This module defines a mechanism for serving credential metadata as a signed JWT from a dedicated URI, binding the metadata to the credential and its issuer.

The signed credential metadata is the mechanism by which the Wallet determines which transaction data types a PaSO Credential supports, as required by [PaSO Core] Section 7.

In addition, this module defines an ad-hoc channel (Section 5) by which the metadata for a single transaction data type can be supplied within the `transaction_data` entry itself, by a Relying Party that the Attestation Provider authorises in the signed credential metadata. This allows an Attestation Provider that also acts as the Relying Party to supply transaction-specific or updated metadata without rotating the signed credential metadata JWT.

### 1.2 Requirements Notation

The key words "**MUST**", "**MUST NOT**", "**REQUIRED**", "**SHALL**", "**SHALL NOT**", "**SHOULD**", "**SHOULD NOT**", "**RECOMMENDED**", "**MAY**", and "**OPTIONAL**" in this document are to be interpreted as described in [RFC2119] and [RFC8174] when, and only when, they are written in all capital letters.

## 2 Credential Metadata URI

This section defines an extension to [OID4VCI] Credential Issuer Metadata for serving signed credential metadata.

- **`credential_metadata_uri`**: **OPTIONAL** (string). A new parameter for entries in `credential_configurations_supported` as defined in [OID4VCI] Section 12.2.4. A URL that serves the `credential_metadata` object as defined in [OID4VCI] Section 12.2.4, extended with `transaction_data_types` per Section 3.

The Attestation Provider **SHALL** include a `credential_metadata_uri` in each PaSO Credential configuration within the Credential Issuer Metadata and **SHALL** serve the credential metadata at that URI.

When fetching from a `credential_metadata_uri`, the Wallet **SHALL** include an `Accept` header and an `Accept-Language` header per [OID4VCI] Section 12.2.2. If the `Accept` header is absent or does not express a preference, the Attestation Provider **SHALL** default to `application/json`. The Attestation Provider **MAY** refuse requests without an `Accept-Language` header; if it does, it **SHALL** respond with HTTP status code 400 (Bad Request).

- `Accept: application/json` — The Attestation Provider **SHALL** return the credential metadata as a plain JSON object, i.e. the `credential_metadata` object extended with `transaction_data_types` per Section 3, without the JWT payload structure defined in Section 4. Note that per Section 3, the Wallet cannot rely on this unsigned form for PaSO Credentials.
- `Accept: application/jwt` — The Attestation Provider **SHALL** return the credential metadata as a signed JWT per Section 4.

The Attestation Provider **MAY** serve one or more locales per signed JWT. The Attestation Provider **SHALL** include at least the first supported locale from the `Accept-Language` header and **MAY** include additional locales.

## 3 Transaction Data Types in Credential Metadata

The credential metadata for a PaSO Credential **SHALL** include the following parameter:

- **`transaction_data_types`**: **REQUIRED** (object). An object where each key is a transaction data type identifier following the `urn:paso:sca:<domain>:<suffix>:<version>` structure defined in [PaSO Core] Section 5.2, and each value is an object containing:
  - **`claims`**: **REQUIRED**. Array of claim metadata objects per Section 3.1.
  - **`ui_labels`**: **REQUIRED** when the credential is issued to a Wallet that does not have a dedicated UI for the transaction data type; **OPTIONAL** otherwise. Object providing localised strings for the consent UI per Section 3.2.
  - Additional parameters **MAY** be defined and used. The Wallet **MUST** ignore any unrecognised parameters.

The `transaction_data_types` object **MAY** be empty and **MAY** omit transaction data types that the Attestation Provider uses. A transaction data type absent from the signed credential metadata is supported by the credential only for a `transaction_data` entry that carries ad-hoc metadata valid per Section 5.3; a `transaction_data` entry of such a type without a `metadata` parameter is not supported by the credential for the purposes of [PaSO Core] Section 7. Where `transaction_data_types` is empty, locale selection per [PaSO View] Section 4 for the credential metadata, as required in Sections 4 and 6, **SHALL** be treated as succeeding.

Transaction data types intended for use by third-party Relying Parties should be published in the signed credential metadata. Types the Attestation Provider does not publish are reserved for the Relying Parties it authorises to supply ad-hoc metadata (Sections 5.2 and 5.5).

A PaSO Credential **SHALL NOT** be accepted by the Wallet unless its credential metadata was obtained as a signed JWT from the `credential_metadata_uri` and successfully verified per Section 7. The signed credential metadata JWT is the authoritative source for the credential metadata, except that ad-hoc transaction data metadata supplied per Section 5 takes precedence for the individual transaction it accompanies; the Wallet **SHALL NOT** use unsigned credential metadata from the Credential Issuer Metadata endpoint for PaSO Credentials.

If, during issuance, the Wallet determines that a credential is a PaSO Credential but does not hold a validly signed credential metadata JWT for it, the Wallet **SHALL** reject the issuance and inform the user.

### 3.1 Claims Metadata

Each entry in `transaction_data_types` **MUST** supply metadata for each claim of the transaction data payload using the `claims` parameter. Each claim metadata object uses the structure defined in [OID4VCI] Appendix B.2, with the following differences:

- The `path` parameter resolves against the `transaction_data` `payload` object, not against the credential itself.
- A `value_type` parameter (string) **MAY** be added to claim objects that have a `display` array. It indicates how the Wallet **SHALL** format the claim value for display. If omitted, the value is treated as plain text and **MUST** be a string. The `value_type` parameter **MUST NOT** be used on claims without a `display` array. The set of supported value types is defined by the applicable Transaction Data Type Rulebook or by other PaSO specifications.
- A `display_type` parameter (string) **MAY** be added to `display` entry objects. It governs how the Wallet **SHALL** format the `name` text of that display entry, applying the same rendering rules as the corresponding `value_type` but to the label. If omitted, the label is plain text.
- The `name` of each `display` entry is subject to the label constraints defined in Section 3.3, which also restrict the permitted `display_type` values.

Claims that are relevant to the user's consent **MUST** include a `display` array with entries for the locales served in that signed JWT. Claims without a `display` array **MUST** be internal values irrelevant to the user's consent.

The `display` entries and `value_type` provide default rendering hints. The applicable Transaction Data Type Rulebook defines the semantic meaning of each claim; a Wallet that implements a specific rulebook **MAY** provide its own labels or visual representations in place of the metadata-supplied `display` entries, provided the meaning remains clear and unmistakable to the user.

### 3.2 UI Labels

Each entry in `transaction_data_types` **MAY** include a `ui_labels` object providing localised strings for consent UI elements. The `ui_labels` object is a set of key-value pairs where each key is a UI element identifier and each value is an array of objects containing:

- `locale`: **OPTIONAL**. A [RFC5646] language tag. An entry without `locale` is a default entry. The same applies to entries without `locale` in a claim's `display` array (Section 3.1). Default entries are used only when no locale in the Wallet's locale priority list matches, and then for every array at once, per [PaSO View] Section 4. Section 3.3 requires all arrays of a transaction data type to provide the same locales and either all or none of them to provide a default entry.
- `value`: The localised string.
- `value_type`: **OPTIONAL**. A `value_type` as defined in Section 3.1 governing how the Wallet formats the `value`. If omitted, treated as plain text. Restricted to the text-producing value types per Section 3.3.

The following UI element identifiers are defined by this specification:

- **`affirmative_action_label`**: Label for the confirmation action (e.g., "Confirm Payment").
- **`denial_action_label`**: Label for the denial action. If absent, the Wallet **SHALL** provide its own.
- **`transaction_title`**: Title for the consent screen. If absent, the Wallet **MAY** provide its own.
- **`security_hint`**: A security hint displayed to the user. When present, the Wallet **SHALL** display it exactly as provided and **SHALL NOT** alter or remove it. Its entries **MUST NOT** include a `value_type`; the value is always plain text (Section 3.3).

All `ui_labels` values are subject to the label constraints defined in Section 3.3.

Additional UI element identifiers **MAY** be defined by Transaction Data Type Rulebooks or other PaSO specifications. The Wallet **SHALL** ignore any unrecognised UI element identifiers.

As with claims, the applicable Transaction Data Type Rulebook defines the semantic meaning of each UI element identifier. A Wallet that implements a specific rulebook **MAY** replace `ui_labels` text with its own labels or visual representations, provided the meaning remains clear and unmistakable to the user. The `security_hint` is an exception: it **SHALL** always be displayed exactly as provided.

### 3.3 Label and Structural Constraints

The following constraints apply to all human-readable label strings in a `transaction_data_types` entry: the `name` of each claim `display` entry (Section 3.1) and the `value` of each `ui_labels` entry (Section 3.2).

Label lengths are counted in extended grapheme clusters as defined in [UAX29]. Labels **MUST NOT** exceed the following maximum lengths:

| Label                                | Maximum length (grapheme clusters) |
|--------------------------------------|------------------------------------|
| Claim `display` entry `name`         | 60                                 |
| `transaction_title`                  | 100                                |
| `affirmative_action_label`           | 40                                 |
| `denial_action_label`                | 40                                 |
| `security_hint`                      | 160                                |

Specifications and Transaction Data Type Rulebooks that define additional UI element identifiers **SHALL** define a maximum length for their values; if none is defined, a maximum of 100 grapheme clusters applies.

The maximum lengths are chosen so that a conforming Wallet can always display a conforming label in full; the Wallet's corresponding display obligations — including the prohibition of truncation and the handling of labels that cannot be displayed in full — are defined in [PaSO View] Section 2. Attestation Providers **SHOULD** keep labels, in every locale, substantially shorter than the maxima: the limits are an upper bound for interoperability, not a target.

Labels **MUST NOT** contain C0 or C1 control characters; this prohibits line breaks within labels — line wrapping is a rendering decision of the Wallet. Labels and `transaction_data` `payload` string values **MUST NOT** contain the Unicode directional embedding or override characters U+202A through U+202E. The directional isolate characters U+2066 through U+2068 **MAY** be used, provided each isolate is properly terminated by U+2069.

Labels are text. A `display` entry's `display_type` and a `ui_labels` entry's `value_type` **MUST** be either `mini_markdown` or `template:mini_markdown` as defined in [PaSO View], or absent (plain text). Value types that produce non-textual or standalone content — in particular `image`, `url`, and `label_only` — **MUST NOT** be used for labels. `security_hint` values **MUST** be plain text: a `security_hint` entry **MUST NOT** carry a `value_type`.

The following structural constraints apply to each `transaction_data_types` entry:

- The `claims` array **MUST NOT** contain two claim metadata objects with the same `path` and **MUST NOT** contain more than 100 claim metadata objects.
- A `display` array, and each `ui_labels` entry array, **MUST NOT** contain two entries with the same `locale` and **MUST NOT** contain more than one entry without a `locale`.
- Every claim `display` array and every `ui_labels` entry array of the entry **MUST** contain entries for the same set of `locale` values, compared case-insensitively, and **MUST** either all contain a default entry or all contain none. This ensures that the Wallet renders the consent screen from a single locale, or entirely from default entries, per [PaSO View] Section 4.
- A `locale` value **MUST NOT** be `default`, compared case-insensitively. That string is reserved for reporting the selection of default entries in `display_locale` per [PaSO View] Section 4.

For labels whose `value_type` or `display_type` uses the `template:` prefix defined in [PaSO View], the limits apply to the fully interpolated result. The Wallet enforces these constraints at rendering time per [PaSO View] Section 2. Independent of rendering, the Wallet **SHALL** treat a transaction data type whose metadata violates these constraints as not supported by the credential.

## 4 Signed Credential Metadata JWT

When the Wallet requests `Accept: application/jwt`, the Attestation Provider **SHALL** return the credential metadata as a signed JWT with the following structure:

- The JOSE header **SHALL** include:
  - `typ`: set to `credential-metadata+jwt`.
  - `x5c`: **REQUIRED** when the credential's issuer keys are published as an x5c certificate chain. The Attestation Provider's certificate chain.
  - `kid`: **REQUIRED** when the credential's issuer keys are instead published in a key set resolved via the credential format's issuer-key mechanism (e.g., [SD-JWT-VC] issuer metadata). Identifies the signing key within that key set. In this case, `x5c` **SHALL NOT** be used.
- The JWT payload **SHALL** include:
  - `iss`: **REQUIRED**. The Credential Issuer Identifier.
  - `sub`: **REQUIRED**. The credential type identifier as defined by the credential format: the `vct` claim value for [SD-JWT-VC], or the `docType` value of the mobile security object (MSO) for [mdoc].
  - `format`: **REQUIRED**. The credential format identifier as defined in [OID4VCI] (e.g., `dc+sd-jwt`, `mso_mdoc`).
  - `iat`: **REQUIRED**. Issuance time.
  - `exp`: **REQUIRED**. Expiration time. The Attestation Provider **SHOULD** set a validity period appropriate for the rate of metadata change.
  - `credential_metadata_uri`: **REQUIRED**. The URL from which this JWT was served and from which the Wallet **SHALL** re-fetch it upon renewal.
  - `credential_metadata`: **REQUIRED**. The `credential_metadata` object as defined in [OID4VCI] Section 12.2.4, extended with `transaction_data_types` per Section 3.
- The JWT **SHALL** be signed using an algorithm appropriate for the signing key: the key in the `x5c` leaf certificate, or the key set key identified by `kid`.

The Attestation Provider **SHALL** rotate signed credential metadata JWTs before their `exp` time and **SHOULD** set `exp` values that balance freshness against unnecessary network traffic.

The Wallet **MAY** refuse issuance if locale selection per [PaSO View] Section 4 does not succeed for the returned metadata and its locale priority list. Metadata for which selection succeeds only through default entries is compatible and **SHALL NOT** be refused on locale grounds.

## 5 Ad-hoc Transaction Data Metadata

This section defines an alternative mechanism for supplying transaction data type metadata. It is designed for the first-party flow ([PaSO Core] Section 3), in which the Attestation Provider also acts as the Relying Party. Instead of relying solely on the corresponding entry in the signed credential metadata JWT, the metadata for a transaction data type **MAY** be supplied ad hoc within the `transaction_data` entry itself, by a Relying Party that the Attestation Provider authorises in the signed credential metadata (Section 5.2). Ad-hoc metadata is not separately signed. Its integrity and origin are established by the signature of the Authorization Request that carries it, and the Relying Party's authority to supply it derives from the signed credential metadata. This mechanism applies to PaSO Credentials of every credential format supported by [PaSO Core].

### 5.1 The `metadata` Parameter

PaSO extends the [OID4VP] `transaction_data` entry with the following parameter, in addition to the `payload` parameter defined in [PaSO Core] Section 7.1:

- **`metadata`**: **OPTIONAL** (object). Ad-hoc metadata for the transaction data type identified by the `type` of the enclosing `transaction_data` entry. The object has the same structure as a single `transaction_data_types` entry value as defined in Section 3, i.e. it contains `claims` per Section 3.1, `ui_labels` per Section 3.2 where applicable, and any additional parameters. The requirements of Sections 3.1, 3.2, and 3.3 apply unchanged.

A Relying Party **SHALL NOT** include a `metadata` parameter in a `transaction_data` entry unless its `client_id` is listed in `adhoc_metadata_clients` (Section 5.2) of the signed credential metadata of every credential the entry targets.

### 5.2 Authorised Clients

PaSO extends the credential metadata (Section 3) with the following parameter:

- **`adhoc_metadata_clients`**: **OPTIONAL** (array of strings). The Relying Parties authorised to supply ad-hoc metadata for this credential. Each element is a `client_id` per [OID4VP], including its Client Identifier Prefix. If present, the array **SHALL NOT** be empty and **SHALL NOT** contain duplicate elements. If absent, no Relying Party is authorised.

Each element **SHALL** use a Client Identifier Prefix under which the Wallet authenticates the `client_id` through the signature of the Authorization Request, such as `x509_san_dns` or `x509_hash` as defined in [OID4VP]. The `redirect_uri` prefix **SHALL NOT** be used.

The Attestation Provider **SHOULD** list only Relying Parties it operates itself, and **SHOULD** ensure that their request-signing keys are protected in a hardware security module (HSM) or equivalent (Section 5.5).

Because `adhoc_metadata_clients` is part of the signed credential metadata JWT, it is bound to the credential and its issuer by the verification in Section 7. Changes to it take effect when the Wallet renews that JWT per Section 8.

### 5.3 Verification

When a PaSO-targeted `transaction_data` entry contains a `metadata` parameter, the Wallet **SHALL** perform the following checks for each targeted credential before relying on the ad-hoc metadata:

1. Confirm that the signature of the Authorization Request was verified and its `client_id` authenticated per [OID4VP] for the Client Identifier Prefix in use, as required by [PaSO Core] Section 3.
2. Verify that the signed credential metadata JWT of the targeted credential is valid per Section 7.
3. Verify that the `client_id` of the Authorization Request exactly equals an element of `adhoc_metadata_clients` in that JWT, including the Client Identifier Prefix.
4. Verify that the `metadata` parameter is a JSON object that conforms to Sections 3.1, 3.2, and 3.3.

If any step fails, the ad-hoc metadata **SHALL** be considered invalid and the `transaction_data` entry **SHALL** be considered incompatible for the targeted credential per [PaSO Core] Section 7.4.2. The Wallet **SHALL NOT** fall back to the stored credential metadata entry for a `transaction_data` entry whose `metadata` parameter is invalid.

### 5.4 Precedence and Processing

Ad-hoc metadata that is valid per Section 5.3 is authoritative for the enclosing `transaction_data` entry:

- It **SHALL** be used in place of the corresponding `transaction_data_types` entry from the signed credential metadata JWT, for this transaction only.
- A transaction data type covered by valid ad-hoc metadata **SHALL** be considered supported by the targeted credential for the purposes of [PaSO Core] Section 7, even if it is absent from the signed credential metadata.
- The `metadata_integrity` claim per [PaSO Core] Section 6.1 **SHALL** carry the integrity value of the signed credential metadata JWT against which step 3 of Section 5.3 was performed. The ad-hoc metadata itself is covered by `transaction_data_hash` and `request_integrity`. Together, these claims record both the authorisation and the metadata that was displayed.

If locale selection per [PaSO View] Section 4 does not succeed for the ad-hoc metadata and the Wallet's locale priority list, the Wallet **MAY** treat the `transaction_data` entry as incompatible. Ad-hoc metadata for which selection succeeds only through default entries is compatible and **SHALL NOT** be treated as incompatible on locale grounds.

The Wallet **SHALL NOT** persist ad-hoc metadata beyond the processing of the transaction it accompanies. Sections 6 and 8 do not apply to ad-hoc metadata. Because ad-hoc metadata is delivered within the presentation request, its use involves no additional network retrieval and is not subject to the linkability considerations of Section 8.

### 5.5 Security Considerations

_**Note**: This section is **informative**._

Ad-hoc metadata determines what the user is shown at consent, including the claim labels and the confirmation action. Its authority rests on two signatures:

- The signed credential metadata JWT, verified per Section 7 and bound to the credential, establishes that the Attestation Provider has authorised the listed Relying Parties.
- The Authorization Request signature, verified per [OID4VP], establishes that the metadata originates from one of those Relying Parties and was not altered in transit.

Forging ad-hoc metadata therefore requires one of the following:

- the Attestation Provider's metadata-signing key, at which point the signed credential metadata is equally forgeable; or
- the ability to sign Authorization Requests as an authorised client.

The second path is the trust assumption this mechanism adds. Authority over the consent screen moves from the issuer's metadata-signing key, which can be kept offline, to the authorised Relying Party's request-signing key, which is typically used online. This is why Section 5.2 recommends authorising only Relying Parties the Attestation Provider operates itself, and protecting their request-signing keys in an HSM.

The choice of Client Identifier Prefix determines what is authorised:

- With `x509_san_dns`, any certificate for the Relying Party's DNS name issued by a CA in the Wallet's trust store authenticates the client.
- With `x509_hash`, a single certificate is pinned. Replacing that certificate then requires rotating the signed credential metadata JWT.

Revoking an authorisation also requires rotating the signed credential metadata JWT. Wallets may continue to rely on a previously verified JWT until its `exp`, so that `exp` bounds how long a removed or compromised client remains authorised.

Because ad-hoc metadata is part of the Authorization Request, it is bound to that request's `nonce` and cannot be replayed in another transaction. It can therefore be specific to a single transaction.

Together with Section 3, this mechanism lets an Attestation Provider reserve transaction data types: types it does not publish in the signed credential metadata are usable only by the Relying Parties listed in `adhoc_metadata_clients`. A typical case is a bank acting as Attestation Provider, Relying Party, and Authorizing Party. It uses unpublished transaction data types for its own transactions, while third-party Relying Parties use the published ones. As the Authorizing Party, the bank also receives the signed Authorization Request in the proof package and can confirm which metadata was displayed.

## 6 Storage and Handling

The Wallet **SHALL** persist signed credential metadata JWTs in their signed form and **SHALL NOT** persist the decoded credential metadata. The Wallet **MAY** store multiple signed metadata JWTs per credential to cover different locales. Each time the Wallet loads a metadata JWT from storage, it **SHALL** perform the full verification procedure defined in Section 7.

If a stored metadata JWT fails verification upon loading (e.g., due to expiry or corruption), the Wallet **SHALL** discard it and re-fetch and verify it per Section 7. The Wallet **SHALL NOT** proceed with any PaSO operation for that credential until a valid metadata JWT is obtained for which locale selection per [PaSO View] Section 4 succeeds.

## 7 Verification

The Wallet **SHALL** perform the following verification each time it needs to rely on a signed credential metadata JWT:

1. Verify that the `typ` JOSE header parameter is `credential-metadata+jwt`.
2. Verify the JWT signature.
3. Verify the signing key trust:
   - When the credential's issuer keys are x5c-based, verify the `x5c` certificate chain in the JOSE header against the Wallet's trust store.
   - Otherwise, verify that the JWT is signed by a key from the credential issuer's published key set, identified by the `kid` JOSE header parameter and resolved via the credential format's issuer-key mechanism (e.g., [SD-JWT-VC] issuer metadata).
4. Verify that the `iss` claim matches the Credential Issuer Identifier.
5. Verify that the `exp` claim has not passed.
6. Verify the credential binding:
   - The `sub` claim **SHALL** match the credential's type identifier as defined by the credential format: the `vct` claim of the credential for [SD-JWT-VC], or the `docType` of the mobile security object (MSO) for [mdoc]. The device-signed namespace `urn:paso:sca:1` ([PaSO Core] Section 6.3) is not a credential type identifier and **SHALL NOT** be accepted as a `sub` value.
   - When the credential carries an `x5c` certificate chain:
     - The root CA in the metadata JWT's `x5c` chain **SHALL** be the same as the root CA in the credential's `x5c` chain.
     - The Subject of the leaf certificate in the metadata JWT's `x5c` chain **SHALL** match the Subject of the leaf certificate in the credential's `x5c` chain.
   - When the credential does not carry an `x5c` certificate chain, the metadata JWT **SHALL** have been verified per step 3 using a key from the same issuer key set that verifies the credential itself, and the `iss` claim **SHALL** equal the credential's issuer identifier.

If any step fails, the metadata JWT **SHALL** be considered invalid and the Wallet **SHALL** exclude the credential from further processing. During issuance, the Wallet **SHALL** reject the issuance and inform the user.

## 8 Renewal and Unlinkability

Upon fetching a signed credential metadata JWT, the Wallet **SHALL** verify that the `credential_metadata_uri` claim matches the URI from which the JWT was retrieved, after following any HTTP redirects. If they do not match, the JWT **SHALL** be considered invalid per Section 6. The Wallet **SHALL** use the `credential_metadata_uri` claim of the most recently verified JWT for subsequent renewals, allowing the Attestation Provider to relocate the endpoint via HTTP redirects.

The Wallet **SHALL** renew each signed credential metadata JWT before its `exp` time by re-fetching from the `credential_metadata_uri`, and **MAY** re-fetch at any other time. The Wallet **MAY** fetch additional locales by issuing separate requests with different `Accept-Language` headers during renewal.

Credential metadata retrieval **SHALL NOT** be linkable to credential usage. The Wallet **SHALL NOT** fetch credential metadata immediately before or after a presentation in a pattern that would allow a network observer to correlate the two activities.

## 9 References

| Reference   | Description                                                                                                                |
|-------------|----------------------------------------------------------------------------------------------------------------------------|
| [PaSO Core] | [PaSO Core](../paso-core.md)                                                                                               |
| [PaSO View] | [PaSO View](../paso-view.md)                                                                                               |
| [OID4VP]    | [OpenID for Verifiable Presentations 1.0](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html)             |
| [OID4VCI]   | [OpenID for Verifiable Credential Issuance 1.0](https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0.html) |
| [RFC2119]   | [RFC 2119 — Key words for use in RFCs](https://www.rfc-editor.org/rfc/rfc2119.html)                                        |
| [RFC8174]   | [RFC 8174 — Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words](https://www.rfc-editor.org/rfc/rfc8174.html)        |
| [RFC5646]   | [RFC 5646 — Tags for Identifying Languages](https://www.rfc-editor.org/rfc/rfc5646.html)                                   |
| [SD-JWT-VC] | [SD-JWT-based Verifiable Credentials](https://datatracker.ietf.org/doc/draft-ietf-oauth-sd-jwt-vc/)                        |
| [UAX29]     | [Unicode Standard Annex #29 — Unicode Text Segmentation](https://www.unicode.org/reports/tr29/)                            |
| [mdoc]      | [ISO/IEC 18013-5:2021 — Mobile driving licence application](https://www.iso.org/standard/69084.html)                       |

## Annex A: Examples

_**Note**: This annex is **informative**._

### A.1 Credential Configuration

A `credential_configurations_supported` entry with `credential_metadata_uri`:

```json
{
  "credential_configurations_supported": {
    "BankPaymentCard": {
      "format": "dc+sd-jwt",
      "vct": "https://bank.example/sca/card",
      "scope": "BankPaymentCard",
      "cryptographic_binding_methods_supported": ["jwk"],
      "credential_signing_alg_values_supported": ["ES256"],
      "credential_metadata_uri": "https://issuer.bank.example/credential-metadata/BankPaymentCard"
    }
  }
}
```

### A.2 Signed Credential Metadata JWT Payload

```json
{
  "iss": "https://issuer.bank.example",
  "sub": "https://bank.example/sca/card",
  "format": "dc+sd-jwt",
  "iat": 1710000000,
  "exp": 1710086400,
  "credential_metadata_uri": "https://issuer.bank.example/credential-metadata/BankPaymentCard",
  "credential_metadata": {
    "display": [
      {
        "name": "Bank Payment Card",
        "locale": "en",
        "logo": {
          "uri": "https://issuer.bank.example/logo.png",
          "alt_text": "Bank logo"
        }
      },
      {
        "name": "Bank Zahlungskarte",
        "locale": "de",
        "logo": {
          "uri": "https://issuer.bank.example/logo.png",
          "alt_text": "Bank-Logo"
        }
      }
    ],
    "transaction_data_types": {
      "urn:paso:sca:global:payment:1": {
        "claims": [
          {
            "path": ["transaction_id"],
            "mandatory": true
          },
          {
            "path": ["amount"],
            "mandatory": true,
            "value_type": "iso_currency_amount",
            "display": [
              { "locale": "en", "name": "Amount" },
              { "locale": "de", "name": "Betrag" }
            ]
          },
          {
            "path": ["payee", "name"],
            "mandatory": true,
            "display": [
              { "locale": "en", "name": "Payee" },
              { "locale": "de", "name": "Empfänger" }
            ]
          },
          {
            "path": ["payee", "id"],
            "mandatory": true
          }
        ]
      }
    }
  }
}
```

### A.3 Metadata Request

```http
GET /credential-metadata/BankPaymentCard HTTP/1.1
Host: issuer.bank.example
Accept: application/jwt
Accept-Language: de, en;q=0.8
```

### A.4 Transaction Data Entry with Ad-hoc Metadata

A decoded `transaction_data` entry carrying ad-hoc metadata, in a signed Authorization Request whose `client_id` is `x509_san_dns:bank.example`. The Wallet accepts the metadata only if that `client_id` is listed in `adhoc_metadata_clients` of the credential's signed credential metadata, as in A.7.

```json
{
  "type": "urn:paso:sca:global:payment:1",
  "credential_ids": ["bank_card"],
  "payload": {
    "transaction_id": "89d0a218-7f52-4dd0-b503-9b0146bfb0ef",
    "amount": "EUR 45.00",
    "payee": {
      "name": "Merchant Ltd",
      "id": "DE89370400440532013000"
    }
  },
  "metadata": {
    "claims": [
      {
        "path": ["transaction_id"],
        "mandatory": true
      },
      {
        "path": ["amount"],
        "mandatory": true,
        "value_type": "iso_currency_amount",
        "display": [
          { "locale": "en", "name": "Amount" },
          { "locale": "de", "name": "Betrag" }
        ]
      },
      {
        "path": ["payee", "name"],
        "mandatory": true,
        "display": [
          { "locale": "en", "name": "Payee" },
          { "locale": "de", "name": "Empfänger" }
        ]
      },
      {
        "path": ["payee", "id"],
        "mandatory": true
      }
    ],
    "ui_labels": {
      "affirmative_action_label": [
        { "locale": "en", "value": "Confirm Payment" },
        { "locale": "de", "value": "Zahlung bestätigen" }
      ]
    }
  }
}
```

### A.5 Signed Credential Metadata JWT Payload with Authorised Ad-hoc Metadata Clients

A signed credential metadata JWT payload for a PaSO Credential in `mso_mdoc` format that publishes one transaction data type and authorises two Relying Parties to supply ad-hoc metadata (Section 5.2). The first is identified by DNS name; the second pins a single request-signing certificate via `x509_hash`. The ad-hoc mechanism is format-independent: the same `adhoc_metadata_clients` parameter applies to [SD-JWT-VC] credentials.

```json
{
  "iss": "https://issuer.bank.example",
  "sub": "com.example.bank.paymentcard.1",
  "format": "mso_mdoc",
  "iat": 1710000000,
  "exp": 1710086400,
  "credential_metadata_uri": "https://issuer.bank.example/credential-metadata/BankPaymentCardMdoc",
  "credential_metadata": {
    "display": [
      { "name": "Bank Payment Card", "locale": "en" },
      { "name": "Bank Zahlungskarte", "locale": "de" }
    ],
    "transaction_data_types": {
      "urn:paso:sca:global:payment:1": {
        "claims": [
          {
            "path": ["amount"],
            "mandatory": true,
            "value_type": "iso_currency_amount",
            "display": [
              { "locale": "en", "name": "Amount" },
              { "locale": "de", "name": "Betrag" }
            ]
          }
        ]
      }
    },
    "adhoc_metadata_clients": [
      "x509_san_dns:bank.example",
      "x509_hash:Uvo3HtuIxuhC92rShpgqcT3YXwrqRxWEviRiA0OZszk"
    ]
  }
}
```

### A.6 Transaction Data Type with Default Entries

A `transaction_data_types` entry that serves `en`, `de`, and default entries. Every `display` array and every `ui_labels` entry array carries the same locales and a default entry, as required by Section 3.3. Here the default entries carry the issuer's fallback text in English; a default entry has no `locale`, so the Wallet cannot know its language and reports `default` when it is shown (see [PaSO View] Annex A).

```json
{
  "urn:paso:sca:global:payment:1": {
    "claims": [
      {
        "path": ["transaction_id"],
        "mandatory": true
      },
      {
        "path": ["amount"],
        "mandatory": true,
        "value_type": "iso_currency_amount",
        "display": [
          { "locale": "en", "name": "Amount" },
          { "locale": "de", "name": "Betrag" },
          { "name": "Amount" }
        ]
      },
      {
        "path": ["payee", "name"],
        "mandatory": true,
        "display": [
          { "locale": "en", "name": "Payee" },
          { "locale": "de", "name": "Empfänger" },
          { "name": "Payee" }
        ]
      },
      {
        "path": ["payee", "id"],
        "mandatory": true
      }
    ],
    "ui_labels": {
      "affirmative_action_label": [
        { "locale": "en", "value": "Confirm Payment" },
        { "locale": "de", "value": "Zahlung bestätigen" },
        { "value": "Confirm Payment" }
      ],
      "security_hint": [
        { "locale": "en", "value": "Your bank will never ask you to confirm a payment by phone." },
        { "locale": "de", "value": "Ihre Bank fordert Sie niemals telefonisch zur Bestätigung einer Zahlung auf." },
        { "value": "Your bank will never ask you to confirm a payment by phone." }
      ]
    }
  }
}
```

### A.7 Signed Credential Metadata JWT Payload without Published Transaction Data Types

A signed credential metadata JWT payload for an Attestation Provider that publishes no transaction data types (Section 3). Every PaSO transaction with this credential therefore requires ad-hoc metadata supplied by a Relying Party listed in `adhoc_metadata_clients` (Section 5). The JWT still carries the credential's `display` and the issuer's `risk_signals_encryption_keys`.

```json
{
  "iss": "https://issuer.bank.example",
  "sub": "https://bank.example/sca/card",
  "format": "dc+sd-jwt",
  "iat": 1710000000,
  "exp": 1710086400,
  "credential_metadata_uri": "https://issuer.bank.example/credential-metadata/BankPaymentCard",
  "credential_metadata": {
    "display": [
      { "name": "Bank Payment Card", "locale": "en" },
      { "name": "Bank Zahlungskarte", "locale": "de" }
    ],
    "transaction_data_types": {},
    "adhoc_metadata_clients": ["x509_san_dns:bank.example"],
    "risk_signals_encryption_keys": {
      "keys": [
        {
          "kty": "EC",
          "crv": "P-256",
          "x": "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU",
          "y": "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0",
          "use": "enc",
          "kid": "issuer-enc-1",
          "alg": "ECDH-ES"
        }
      ]
    }
  }
}
```
