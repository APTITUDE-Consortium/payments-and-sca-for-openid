# PaSO Proof: Metadata Module

## Abstract

This document specifies how Attestation Providers serve verifiable credential metadata for PaSO Credentials, and how Wallets retrieve, verify, store, and renew it. It defines the `credential_metadata_uri` extension to [OID4VCI], the signed credential metadata JWT format, the `transaction_data_types` structure within credential metadata, and the claims metadata structure used to describe transaction data payloads.

## 1 Introduction

### 1.1 Overview

[OID4VCI] serves credential metadata as unsigned JSON from the Credential Issuer Metadata endpoint. Unsigned metadata cannot be used as evidence in dispute resolution, and the Wallet cannot verify that it has not been tampered with. This module defines a mechanism for serving credential metadata as a signed JWT from a dedicated URI, binding the metadata to the credential and its issuer.

The signed credential metadata is the mechanism by which the Wallet determines which transaction data types a PaSO Credential supports, as required by [PaSO Core] Section 7.

### 1.2 Requirements Notation

The key words "**MUST**", "**MUST NOT**", "**REQUIRED**", "**SHALL**", "**SHALL NOT**", "**SHOULD**", "**SHOULD NOT**", "**RECOMMENDED**", "**MAY**", and "**OPTIONAL**" in this document are to be interpreted as described in [RFC2119] and [RFC8174] when, and only when, they are written in all capital letters.

## 2 Credential Metadata URI

This section defines an extension to [OID4VCI] Credential Issuer Metadata for serving signed credential metadata.

- **`credential_metadata_uri`**: **OPTIONAL** (string). A new parameter for entries in `credential_configurations_supported` as defined in [OID4VCI] Section 12.2.4. A URL that serves the `credential_metadata` object as defined in [OID4VCI] Section 12.2.4, extended with `transaction_data_types` per Section 3.

The Attestation Provider **SHALL** include a `credential_metadata_uri` in each PaSO Credential configuration within the Credential Issuer Metadata and **SHALL** serve the credential metadata at that URI.

When fetching from a `credential_metadata_uri`, the Wallet **SHALL** include an `Accept` header and an `Accept-Language` header per [OID4VCI] Section 12.2.2. If the `Accept` header is absent or does not express a preference, the Attestation Provider **SHALL** default to `application/json`. The Attestation Provider **MAY** refuse requests without an `Accept-Language` header.

- `Accept: application/json` — The Attestation Provider **SHALL** return the credential metadata as a plain JSON object.
- `Accept: application/jwt` — The Attestation Provider **SHALL** return the credential metadata as a signed JWT per Section 4.

The Attestation Provider **MAY** serve one or more locales per signed JWT. The Attestation Provider **SHALL** include at least the first supported locale from the `Accept-Language` header and **MAY** include additional locales.

## 3 Transaction Data Types in Credential Metadata

The credential metadata for a PaSO Credential **SHALL** include the following parameter:

- **`transaction_data_types`**: **REQUIRED** (object). An object where each key is a transaction data type identifier following the `urn:paso:sca:<domain>:<suffix>:<version>` structure defined in [PaSO Core] Section 5.2, and each value is an object containing:
  - **`claims`**: **REQUIRED**. Array of claim metadata objects per Section 3.1.
  - **`ui_labels`**: **REQUIRED** when the credential is issued to a Wallet that does not have a dedicated UI for the transaction data type; **OPTIONAL** otherwise. Object providing localised strings for the consent UI per Section 3.2.
  - Additional parameters **MAY** be defined and used. The Wallet **MUST** ignore any unrecognised parameters.

A PaSO Credential **SHALL NOT** be accepted by the Wallet unless its credential metadata was obtained as a signed JWT from the `credential_metadata_uri` and successfully verified per Section 6. The signed credential metadata JWT is the sole authoritative source for the credential metadata; the Wallet **SHALL NOT** use unsigned credential metadata from the Credential Issuer Metadata endpoint for PaSO Credentials.

If, during issuance, the Wallet determines that a credential is a PaSO Credential but does not hold a validly signed credential metadata JWT for it, the Wallet **SHALL** reject the issuance and inform the user.

### 3.1 Claims Metadata

Each entry in `transaction_data_types` **MUST** supply metadata for each claim of the transaction data payload using the `claims` parameter. Each claim metadata object uses the structure defined in [OID4VCI] Appendix B.2, with the following differences:

- The `path` parameter resolves against the `transaction_data` `payload` object, not against the credential itself.
- A `value_type` parameter (string) **MAY** be added to claim objects that have a `display` array. It indicates how the Wallet **SHALL** format the claim value for display. If omitted, the value is treated as plain text and **MUST** be a string. The `value_type` parameter **MUST NOT** be used on claims without a `display` array. The set of supported value types is defined by the applicable Transaction Data Type Rulebook or by other PaSO specifications.
- A `display_type` parameter (string) **MAY** be added to `display` entry objects. It governs how the Wallet **SHALL** format the `name` text of that display entry, applying the same rendering rules as the corresponding `value_type` but to the label. If omitted, the label is plain text.

Claims that are relevant to the user's consent **MUST** include a `display` array with entries for the locales served in that signed JWT. Claims without a `display` array **MUST** be internal values irrelevant to the user's consent.

The `display` entries and `value_type` provide default rendering hints. The applicable Transaction Data Type Rulebook defines the semantic meaning of each claim; a Wallet that implements a specific rulebook **MAY** provide its own labels or visual representations in place of the metadata-supplied `display` entries, provided the meaning remains clear and unmistakable to the user.

### 3.2 UI Labels

Each entry in `transaction_data_types` **MAY** include a `ui_labels` object providing localised strings for consent UI elements. The `ui_labels` object is a set of key-value pairs where each key is a UI element identifier and each value is an array of objects containing:

- `locale`: **OPTIONAL**. A [RFC5646] language tag. Entries without `locale` serve as defaults.
- `value`: The localised string.
- `value_type`: **OPTIONAL**. A `value_type` as defined in Section 3.1 governing how the Wallet formats the `value`. If omitted, treated as plain text.

The following UI element identifiers are defined by this specification:

- **`affirmative_action_label`**: Label for the confirmation action (e.g., "Confirm Payment").
- **`denial_action_label`**: Label for the denial action. If absent, the Wallet **SHALL** provide its own.
- **`transaction_title`**: Title for the consent screen. If absent, the Wallet **MAY** provide its own.
- **`security_hint`**: A security hint displayed to the user. When present, the Wallet **SHALL** display it exactly as provided and **SHALL NOT** alter or remove it.

Additional UI element identifiers **MAY** be defined by Transaction Data Type Rulebooks or other PaSO specifications. The Wallet **SHALL** ignore any unrecognised UI element identifiers.

As with claims, the applicable Transaction Data Type Rulebook defines the semantic meaning of each UI element identifier. A Wallet that implements a specific rulebook **MAY** replace `ui_labels` text with its own labels or visual representations, provided the meaning remains clear and unmistakable to the user. The `security_hint` is an exception: it **SHALL** always be displayed exactly as provided.

## 4 Signed Credential Metadata JWT

When the Wallet requests `Accept: application/jwt`, the Attestation Provider **SHALL** return the credential metadata as a signed JWT with the following structure:

- The JOSE header **SHALL** include:
  - `x5c`: the Attestation Provider's certificate chain.
  - `typ`: set to `credential-metadata+jwt`.
- The JWT payload **SHALL** include:
  - `iss`: **REQUIRED**. The Credential Issuer Identifier.
  - `sub`: **REQUIRED**. The credential type identifier as defined by the credential format (e.g., `vct` for [SD-JWT-VC], `doctype` for [mdoc]).
  - `format`: **REQUIRED**. The credential format identifier as defined in [OID4VCI] (e.g., `dc+sd-jwt`, `mso_mdoc`).
  - `iat`: **REQUIRED**. Issuance time.
  - `exp`: **REQUIRED**. Expiration time. The Attestation Provider **SHOULD** set a validity period appropriate for the rate of metadata change.
  - `credential_metadata_uri`: **REQUIRED**. The URL from which this JWT was served and from which the Wallet **SHALL** re-fetch it upon renewal.
  - `credential_metadata`: **REQUIRED**. The `credential_metadata` object as defined in [OID4VCI] Section 12.2.4, extended with `transaction_data_types` per Section 3.
- The JWT **SHALL** be signed using an algorithm appropriate for the key in the `x5c` leaf certificate.

The Attestation Provider **SHALL** rotate signed credential metadata JWTs before their `exp` time and **SHOULD** set `exp` values that balance freshness against unnecessary network traffic.

The Wallet **MAY** refuse issuance if the returned metadata does not contain any locale compatible with its locale priority list.

## 5 Storage and Handling

The Wallet **SHALL** persist signed credential metadata JWTs in their signed form and **SHALL NOT** persist the decoded credential metadata. The Wallet **MAY** store multiple signed metadata JWTs per credential to cover different locales. Each time the Wallet loads a metadata JWT from storage, it **SHALL** perform the full verification procedure defined in Section 6.

If a stored metadata JWT fails verification upon loading (e.g., due to expiry or corruption), the Wallet **SHALL** discard it and re-fetch and verify it per Section 6. The Wallet **SHALL NOT** proceed with any PaSO operation for that credential until a valid metadata JWT covering the required locale is obtained.

## 6 Verification

The Wallet **SHALL** perform the following verification each time it needs to rely on a signed credential metadata JWT:

1. Verify that the `typ` JOSE header parameter is `credential-metadata+jwt`.
2. Verify the JWT signature.
3. Verify the `x5c` certificate chain in the JOSE header against the Wallet's trust store.
4. Verify that the `iss` claim matches the Credential Issuer Identifier.
5. Verify that the `exp` claim has not passed.
6. Verify the credential binding:
   - The `sub` claim **SHALL** match the credential's type identifier as defined by the credential format (e.g., `vct` for [SD-JWT-VC], `doctype` for [mdoc]).
   - The root CA in the `x5c` chain **SHALL** be the same as the root CA in the credential's `x5c` chain.
   - The Subject of the leaf certificate in the `x5c` chain **SHALL** match the Subject of the leaf certificate in the credential's `x5c` chain.

If any step fails, the metadata JWT **SHALL** be considered invalid and the Wallet **SHALL** exclude the credential from further processing. During issuance, the Wallet **SHALL** reject the issuance and inform the user.

## 7 Renewal and Unlinkability

The Wallet **SHALL** renew each signed credential metadata JWT before its `exp` time by re-fetching from the `credential_metadata_uri`, and **MAY** re-fetch at any other time. The Wallet **MAY** fetch additional locales by issuing separate requests with different `Accept-Language` headers during renewal.

Credential metadata retrieval **SHALL NOT** be linkable to credential usage. The Wallet **SHALL NOT** fetch credential metadata immediately before or after a presentation in a pattern that would allow a network observer to correlate the two activities.

## 8 References

| Reference   | Description                                                                                                                |
|-------------|----------------------------------------------------------------------------------------------------------------------------|
| [PaSO Core] | [PaSO Core](../paso-core.md)                                                                                               |
| [OID4VP]    | [OpenID for Verifiable Presentations 1.0](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html)             |
| [OID4VCI]   | [OpenID for Verifiable Credential Issuance 1.0](https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0.html) |
| [RFC2119]   | [RFC 2119 — Key words for use in RFCs](https://www.rfc-editor.org/rfc/rfc2119.html)                                        |
| [RFC8174]   | [RFC 8174 — Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words](https://www.rfc-editor.org/rfc/rfc8174.html)        |
| [RFC5646]   | [RFC 5646 — Tags for Identifying Languages](https://www.rfc-editor.org/rfc/rfc5646.html)                                   |
| [SD-JWT-VC] | [SD-JWT-based Verifiable Credentials](https://datatracker.ietf.org/doc/draft-ietf-oauth-sd-jwt-vc/)                        |
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
      "urn:paso:sca:com.example.payments:payment:1": {
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
