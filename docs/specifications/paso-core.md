# PaSO Core

## Abstract

This document specifies the core structures and processing rules for transaction authentication using [OID4VP] and [OID4VCI]. It defines the roles involved, the governance framework for credentials and transaction data types, the holder binding proof structure, and the transaction data processing pipeline. While designed with payments and Strong Customer Authentication in mind, PaSO is applicable to any domain requiring verifiable, user-consented transactions.

## 1 Introduction

### 1.1 Overview

PaSO (Payments and SCA for OpenID) extends [OID4VP] and [OID4VCI] for verifiable, user-consented transactions. More specifically, it defines a framework to allow using wallets as Strong Customer Authentication and payment means in the context of [PSD2]. [OID4VP] defines the `transaction_data` parameter but leaves its processing, display, and proof semantics open. PaSO fills these gaps with a minimum viable set of structures and rules.

This document, PaSO Core, defines:

- the roles participating in a PaSO transaction,
- what Credential Rulebooks and Transaction Data Type Rulebooks are,
- the holder binding proof structure produced by the Wallet,
- the transaction data processing pipeline.

### 1.2 Scope

PaSO Core does not define metadata infrastructure (serving, signing, or discovery of credential metadata), rendering implementations, transaction logging, or trust establishment. These are addressed by other PaSO specifications.

The Wallet and the Attestation Provider are expected to agree on a mechanism to ensure the integrity of the Wallet environment. A common approach is a long-lived wallet unit attestation that is revoked if integrity can no longer be guaranteed.

### 1.3 Requirements Notation

The key words "**MUST**", "**MUST NOT**", "**REQUIRED**", "**SHALL**", "**SHALL NOT**", "**SHOULD**", "**SHOULD NOT**", "**RECOMMENDED**", "**MAY**", and "**OPTIONAL**" in this document are to be interpreted as described in [RFC2119] and [RFC8174] when, and only when, they are written in all capital letters.

### 1.4 Terminology

| Term                                 | Definition                                                                                                                                                                                                                                                                             |
|--------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| PaSO Credential                      | A credential used with PaSO. Issued by an Attestation Provider into a Wallet and presented to a Relying Party with transaction data and a holder binding proof.                                                                                                                        |
| Dynamic Linking                      | The cryptographic binding of transaction-specific data to the presentation proof, ensuring that the data the user consented to is tamper-evident and verifiable. In the context of [PSD2] Article 97(2), this specifically requires linking to a specific amount and a specific payee. |
| Strong Customer Authentication (SCA) | Authentication using at least two elements from different categories (knowledge, possession, inherence) that are independent of each other, per [PSD2] Article 97.                                                                                                                     |
| Credential Rulebook                  | A governance document that defines the rules for issuing, displaying, and verifying a credential type. See Section 4.                                                                                                                                                                  |
| Transaction Data Type Rulebook       | A governance document that defines the semantic meaning and structure of a specific transaction data type. See Section 5.                                                                                                                                                              |
| Risk Signal Profile                  | A published governance document that bundles risk signal types — defined in [PaSO Risk Signal Registry] — with a per-signal requirement flag and an optional freshness bound. Referenced by signed credential metadata or a Transaction Data Type Rulebook. See [PaSO Risk Signals] Section 3.                          |
| Authorizing Party                    | The party that receives the proof package from the Relying Party, verifies the transaction, and authorizes the action. See Section 2.                                                                                                                                                  |

## 2 Roles

The following roles participate in PaSO transactions:

- **Attestation Provider**: Defined as the Credential Issuer in [OID4VCI]. Issues PaSO Credentials into the Wallet.
- **Wallet**: Defined as the Wallet in [OID4VP]. Stores PaSO Credentials, processes transaction data, and produces the holder binding proof.
- **Relying Party**: Defined as the Verifier in [OID4VP]. Sends presentation requests containing transaction data and receives the verifiable presentation.
- **Authorizing Party**: The party that ultimately authorizes the transaction. It receives the proof package from the Relying Party and verifies it in conjunction with the original presentation request. The Authorizing Party has a trust relationship with the Attestation Provider and the Relying Party.

## 3 Flows

Two common flow types are expected in the PaSO ecosystem:

- **First-party flow**: A single party fulfils the roles of Attestation Provider, Relying Party, and Authorizing Party. The Wallet presents the PaSO Credential back to the party that issued it.

- **Third-party flow**: The Relying Party is distinct from the Attestation Provider and Authorizing Party. The Wallet presents the PaSO Credential to the Relying Party, which forwards the proof package to the Authorizing Party.

The Relying Party **SHALL** send a signed [OID4VP] Authorization Request (Request Object per [JAR]). The Wallet **SHALL** reject unsigned PaSO presentation requests.

## 4 Credential Rulebooks

### 4.1 Purpose

A Credential Rulebook is a governance document that defines the rules for a specific PaSO Credential type. Every PaSO Credential type **SHOULD** have a Credential Rulebook.

### 4.2 Contents

A Credential Rulebook **MAY** specify:

- The nature of a PaSO Credential and its applicable contexts,
- attribute structures for the PaSO Credential,
- display rules for the credential in the Wallet,
- references to one or more Transaction Data Type Rulebooks,
- policies for Attestation Providers and Relying Parties,
- issuance requirements (e.g., validity period, binding to wallet attestations),
- holder binding and user authentication requirements: how the credential key is protected and which user authentication releases it,
- verification requirements for the Relying Party and Authorizing Party,
- the embedded disclosure policy, if applicable.

Strong Customer Authentication is established by holder binding: the credential key is held in the Wallet's secure cryptographic environment (possession) and released only after user authentication (knowledge or inherence). The Credential Rulebook of a PaSO Credential used for Strong Customer Authentication **SHALL** specify the holder binding and user authentication requirements by which its presentations meet [PSD2] Article 97.

Attestation Providers and Relying Parties **SHALL** follow the applicable Credential Rulebook.

## 5 Transaction Data Type Rulebooks

### 5.1 Purpose

A Transaction Data Type Rulebook is a governance document that defines a specific transaction data type. It specifies the semantic meaning of all claims and all UI display requirements.

Every transaction data type identifier used with PaSO **SHALL** have a Transaction Data Type Rulebook published by the organisation that owns the identifier, except a type used only with ad-hoc metadata per [PaSO Proof Metadata] Section 5. For such a type, the ad-hoc metadata supplied by the Relying Party is the complete definition of the type for the transaction it accompanies, and the immutability requirement of Section 5.3 does not apply.

### 5.2 Type Identifiers

Each PaSO transaction data type is identified by a URN following this structure:

```
urn:paso:sca:<domain>:<suffix>:<version>
```

Where:

- `<domain>` is an organisation identifier in reverse domain notation (e.g., `com.example`), or `global` for transaction data types defined by PaSO itself,
- `<suffix>` is one or more colon-separated segments identifying the type (e.g., `payment`),
- `<version>` is a version number (e.g., `1`). It **SHALL** be a positive integer without leading zeros and **SHALL** be the final segment of the identifier. New versions of a transaction data type **SHALL** use monotonically increasing integers.

The Wallet identifies PaSO transaction data entries by checking whether the `type` field starts with the prefix `urn:paso:sca:`.

### 5.3 Rulebook Requirements

A Transaction Data Type Rulebook **SHALL** define, for each claim in the transaction data type:

- the semantic meaning of the claim,
- whether the claim is required or optional in the transaction payload,
- whether the claim must be displayed to the user,
- how the claim value is to be rendered when displayed.

A Transaction Data Type Rulebook **MAY** also define the localised UI labels for the consent screen, including at minimum a label for the confirmation action.

A Transaction Data Type Rulebook **MAY** include a **Static Presentation** section, which enables static rendering of the transaction data type per [PaSO View] Section 5. A Static Presentation section **SHALL** define:

- which claims **SHALL** be displayed in static rendering, and which claims **MAY** be omitted,
- the display obligations for each displayed claim, such as prominence and completeness,
- the meaning of the affirmative action and of the denial action.

These definitions, including any Static Presentation section, constitute the **semantic structure** of the transaction data type. For any given type identifier, the semantic structure **SHALL** be immutable once published. Changes to the semantic structure **SHALL** require a new version of the type identifier.

The Wallet **SHALL** ensure that all claims designated for display — in static rendering, those that the Static Presentation section requires — have been shown to the user before enabling the confirmation action.

### 5.4 Content Quality

All text displayed to the user **SHALL** be short and easily understandable.

### 5.5 Rulebook Obligations

Conformance to a Transaction Data Type Rulebook is ensured by the parties that construct and verify transaction data:

- The Attestation Provider **SHALL** ensure that the `transaction_data_types` entry it publishes for a transaction data type in the signed credential metadata ([PaSO Proof Metadata] Section 3) is consistent with the rulebook. This includes the claims and which of them are required, and any risk signal profiles, risk signals and encryption that the rulebook requires ([PaSO Risk Signals]).
- The Relying Party **SHALL** construct the `payload` of a `transaction_data` entry per the rulebook of its `type`. For a type used only with ad-hoc metadata (Section 5.1), it **SHALL** construct the `payload` per that metadata. Where it supplies ad-hoc metadata ([PaSO Proof Metadata] Section 5) for a type that has a rulebook, it **SHALL** ensure that the metadata is consistent with the rulebook, as the Attestation Provider must for the metadata it publishes.
- The Authorizing Party **SHALL** verify that the `payload` conforms to the rulebook, per [PaSO Proof Verify] Section 3.

A Wallet implements a rulebook by building it in; it does not obtain rulebooks at runtime. The Wallet **SHALL** apply the requirements of every rulebook it implements. For a rulebook it does not implement, the Wallet relies on the credential metadata, which reflects the rulebook by the Attestation Provider's obligation above.

## 6 Holder Binding Proof

### 6.1 SCA Response Claims

The Wallet **SHALL** include the following claims in every PaSO Credential presentation that involves transaction data, embedded in the format-specific proof structure that cryptographically binds the user's consent to the presentation.

| Claim                       | Required    | Description                                                                                                                                                                                                                                   |
|-----------------------------|-------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `jti`                       | yes         | A fresh, cryptographically random value with sufficient entropy per [RFC7519] Section 4.1.7. Unique per presentation. When used for SCA, serves as the Authentication Code per [PSD2].                                                        |
| `display_locale`            | yes         | The locale of the consent screen shown to the user. For dynamic rendering, per [PaSO View] Section 4: the [RFC5646] language tag of the selected `display` and `ui_labels` entries as it appears in the metadata, or the string `default` if the default entries (entries without a `locale`) were shown. For static rendering, per [PaSO View] Section 5.4: an [RFC5646] language tag, never `default`. Enables deterministic reconstruction of which text was shown. |
| `render_mode`               | yes         | The rendering mode used for the transaction data shown during consent: `dynamic` or `static`, per [PaSO View] Section 5.2.                                                                                                                       |
| `transaction_data_hash`     | yes         | Hash of the base64url-encoded `transaction_data` entry selected for the PaSO Credential.                                                                                                                                                      |
| `transaction_data_hash_alg` | yes         | Hash algorithm identifier. Default: `sha-256`.                                                                                                                                                                                                |
| `metadata_integrity`        | yes         | The [W3C.SRI] integrity value of the signed credential metadata JWT (per [PaSO Proof Metadata]) relied on during this presentation: the JWT used to display the transaction data or, where ad-hoc metadata was used, the JWT that authorised the Relying Party to supply it per [PaSO Proof Metadata] Section 5.4. |
| `request_integrity`         | yes         | The [W3C.SRI] integrity value of the signed [OID4VP] Authorization Request ([JAR] Request Object) as received by the Wallet, computed over the compact-serialised JWT string.                                                                 |
| `wallet_instance_version`   | yes         | Version identifier of the Wallet application that authorized the transaction.                                                                                                                                                                 |
| `risk_signals`              | conditional | An array of risk-signal envelopes per [PaSO Risk Signals]. **REQUIRED** when the signal set resolved for the matched transaction data type contains one or more required signals, per [PaSO Risk Signals] Section 4.1; absent otherwise. Signal types are defined by [PaSO Risk Signal Registry]. When encryption is required for the transaction data type, this value is an encrypted structure per [PaSO Risk Signals] instead of a plaintext array. |

The authentication methods used to release the transaction, and the `response_mode` of the Authorization Request, are not claims of this section. They are risk signal types defined by [PaSO Risk Signal Registry] and are carried inside `risk_signals` when the risk signal set in force requires them. Strong Customer Authentication is established by holder binding per Section 4.2. The authentication-methods signal is a Wallet observation like any other risk signal: its presence does not establish Strong Customer Authentication, and its absence does not negate it.

### 6.2 SD-JWT-VC Profile

For PaSO Credentials in [SD-JWT-VC] format, the Wallet **SHALL** include a Key Binding JWT (KB-JWT). The SCA response claims from Section 6.1 **SHALL** be included as top-level claims in the KB-JWT payload, in addition to the standard KB-JWT claims defined by [OID4VP].

### 6.3 mdoc Profile

For PaSO Credentials in [mdoc] format, the Wallet **SHALL** include device authentication. The SCA response claims **SHALL** be included as device-signed data elements in the `DeviceNameSpaces` structure under the namespace `urn:paso:sca:1`.

| Data element                | CBOR type     |
|-----------------------------|---------------|
| `jti`                       | tstr          |
| `display_locale`            | tstr          |
| `render_mode`               | tstr          |
| `transaction_data_hash`     | bstr          |
| `transaction_data_hash_alg` | tstr          |
| `metadata_integrity`        | tstr          |
| `request_integrity`         | tstr          |
| `wallet_instance_version`   | tstr          |
| `risk_signals`              | array of maps |

## 7 Transaction Data Processing

### 7.1 Transaction Data Object

PaSO extends the [OID4VP] `transaction_data` entry with the following parameter:

- **`payload`**: **REQUIRED**. A JSON object containing the transaction details. The structure is defined by the applicable Transaction Data Type Rulebook for the matching `type`.

### 7.2 Locale Selection

For dynamic rendering, locale selection **SHALL** follow [PaSO View] Section 4. The Wallet renders all `display` and `ui_labels` entries from a single locale, selected with the Lookup matching scheme defined in [RFC4647] Section 3.4. If no locale in its priority list matches, it renders all of them from the default entries (entries without a `locale`). The selection **SHALL** be reported in the `display_locale` claim (Section 6.1): the selected metadata `locale` tag, or the string `default`. It reflects the entries actually rendered, not the priority-list locale that led to the selection. For static rendering, `display_locale` is determined per [PaSO View] Section 5.4.

### 7.3 Simple Profile

The simple profile is the minimum PaSO transaction data processing mode and a minimal subset of the advanced profile. All Wallets supporting PaSO **SHALL** implement the simple profile. A Wallet implementing the advanced profile is fully compatible with requests made in the simple profile.

In the simple profile, the presentation request contains exactly one PaSO-targeted `transaction_data` entry, identified by a `type` starting with `urn:paso:sca:`, whose `credential_ids` **SHALL** contain exactly one credential query identifier. When `credential_sets` are used, that credential query identifier **SHALL** appear in every option of every credential set that references it, and at least one such credential set **SHALL** be required; the options **SHALL** be transposable as defined in Section 7.4.1. A request that does not meet these conditions is not in the simple profile (Section 7.4).

The Wallet **SHALL**:

1. Identify the credentials in the Wallet that match the credential query.
2. Retain those credentials with which the entry is compatible per Section 7.5. If none remain, the Wallet **SHALL** cease processing and inform the user.
3. If more than one credential remains, let the user select one. The Wallet **SHALL** display the transaction data as rendered with the selected credential's metadata and **SHALL** update the display when the selection changes.
4. Display the transaction data to the user for consent.
5. If the user consents, proceed with the presentation.

### 7.4 Advanced Profile

The advanced profile applies when a presentation request contains a PaSO-targeted `transaction_data` entry and does not meet the conditions of the simple profile (Section 7.3). Wallets **MAY** implement the advanced profile. Credential Rulebooks and Transaction Data Type Rulebooks **MAY** require that the Wallet supports the advanced profile.

A Wallet that does not support the advanced profile **SHALL** reject such a presentation request and **SHALL** inform the user.

#### 7.4.1 Transaction Data and DCQL Credential Sets

The presentation request **MAY** contain multiple PaSO-targeted `transaction_data` entries.

When `credential_sets` are used in the DCQL query ([OID4VP] Section 6.2), all credential query identifiers referenced by PaSO-targeted `transaction_data` entries' `credential_ids` **SHALL** appear within options of the same credential set.

Each inner array within the `options` of the credential set (hereafter called an **alternative**) lists credential query identifiers that **MUST** all be presented together. An alternative **resolves to** a PaSO-targeted `transaction_data` entry if it contains a credential query identifier listed in that entry's `credential_ids`. When an alternative resolves to multiple PaSO-targeted `transaction_data` entries for the same credential, the Wallet **SHALL** apply the first-match selection rule from Section 7.4.2 step 2.

All alternatives that involve a PaSO-targeted `transaction_data` entry **SHALL** be **transposable**. Transposability means that the user's credential choices must be fully independent of each other. Selecting one credential should never constrain which credentials are available in another slot.

Concretely: it must be possible to decompose the alternatives into a set of independent credential slots _S₁_, _S₂_, …, _Sₖ_, where each slot represents one independent choice the user makes. Each slot contains the credentials the user can pick for that choice, and may also allow the user to pick nothing (making that slot optional). The full list of PaSO-targeted alternatives must be exactly the result of combining every possible selection across all slots.

A Relying Party **SHALL** construct its alternatives so that this holds. If a Wallet detects that the alternatives cannot be decomposed this way, meaning some credential choices are artificially coupled, it **SHALL** stop processing and inform the user.

Alternatives that do not involve any PaSO-targeted `transaction_data` entry are not subject to this requirement.

The Wallet **SHALL** present the PaSO-targeted alternatives to the user as independent choices, one per credential slot. For each slot the user selects one of the available credentials, or none if ∅ is present in that slot. When alternatives resolve to different `transaction_data` entries, the Wallet **SHALL** display the transaction data corresponding to the user's current credential selection. When the user changes a selection that causes a different `transaction_data` entry to apply, the Wallet **SHALL** update the displayed transaction data accordingly.

The ordering of alternatives expresses the Relying Party's preference: the Wallet **SHOULD** derive the display order for each slot from the order in which credential query identifiers first appear across the alternatives. The Wallet **SHOULD** default to the first alternative's selection for each slot, but **MAY** override the default with a credential the user has previously selected in the same context, provided the slot's display order remains as defined by the request.

A presentation request **MAY** combine PaSO Credentials with non-PaSO credentials.

#### 7.4.2 Discovery and Validation

After resolution, exactly one `transaction_data` entry **SHALL** apply to the selected credential. The presentation request **MAY** contain multiple PaSO-targeted `transaction_data` entries provided they conform to the rules in Section 7.4.1.

For the PaSO-targeted entries, the Wallet **SHALL** perform the following steps:

1. The Wallet **SHALL** identify all credentials matching the presentation request that are PaSO Credentials. A credential is a candidate for a PaSO-targeted `transaction_data` entry if the credential matches a credential query whose identifier is listed in that entry's `credential_ids`.
2. For each candidate credential, the Wallet **SHALL** select the first PaSO-targeted `transaction_data` entry (in array order) that targets that credential via `credential_ids` and is compatible with it per Section 7.5, evaluating the conditions of Section 7.5 in order. If no entry is compatible, the credential **SHALL** be excluded.
3. For each candidate credential, where resolution or verification of an external resource (Section 7.5, condition 4) fails for the selected entry, the entry is incompatible and the Wallet **SHALL** resume the selection in step 2 for the affected credential, continuing with the next `transaction_data` entry in array order that targets that credential. If no compatible entry remains for the credential, the credential **SHALL** be excluded.
4. If at any point during the processing of this section no compatible credentials remain, the Wallet **SHALL** cease processing and inform the user.
5. The Wallet **SHALL** present the remaining compatible credentials as alternatives to the user. For the initially selected credential, the Wallet **SHALL** display the `transaction_data` entry matched in step 2.
6. If the user selects a different credential, the Wallet **SHALL** display the `transaction_data` entry matched for that credential in step 2. When the matched `transaction_data` entry differs between credentials, the displayed content **SHALL** update accordingly.
7. If the user consents, the Wallet **MAY** proceed with the presentation.

The first-match rule of step 2 allows a Relying Party to provide versioned transaction data: a newer `type` can be listed first in the `transaction_data` array, with an older `type` as a fallback for credentials that do not yet support it (Annex A.7).

### 7.5 Entry Compatibility

This section applies to both the simple and the advanced profile. A PaSO-targeted `transaction_data` entry is **compatible** with a credential when all of the following hold:

1. The credential matches a credential query whose identifier is listed in the entry's `credential_ids`.
2. The entry's `type` is among the transaction data types supported by the credential.
3. The `payload` conforms to the definition of that type. A `payload` conforms if it does not contain fields not covered by a claim `path` in the applicable claims metadata (companion `#integrity` fields are covered by the `path` of the claim they accompany), all fields declared as required are present, all display formatting directives are supported by the Wallet, and all values conform to their declared formatting. Where the Wallet implements the rulebook of the `type` (Section 5.5), the `payload` conforms only if, in addition, every field it contains is declared or permitted by the rulebook.
4. Every claim of the `payload` that requires resolution of an external resource with integrity verification has been resolved, and its content verified.

A Wallet **SHALL** reject a request whose `transaction_data` entry contains an object with duplicate member names (compared after unescaping).

Other PaSO specifications define further conditions under which an entry is not compatible with a credential.

The following summary is informative. For each entry and candidate credential, the Wallet determines the definition of the type as follows:

1. If the entry carries a `metadata` parameter, the Wallet verifies it per [PaSO Proof Metadata] Section 5.3. Invalid ad-hoc metadata makes the entry incompatible, without fallback to the stored credential metadata. Valid ad-hoc metadata is the definition of the type for this transaction: the `payload` is checked against it and, where the Wallet implements a rulebook for the `type`, also against that rulebook (condition 3). The entry is rendered dynamically ([PaSO View] Section 5.1).
2. Otherwise, the type is supported only if the signed credential metadata lists it (condition 2). The `payload` is checked against that metadata and, where the Wallet implements it, against the rulebook (condition 3).
3. The Wallet then selects the rendering mode: static rendering where [PaSO View] Section 5.1 permits it, and dynamic rendering from the metadata otherwise.

## 8 References

| Reference             | Description                                                                                                                |
|-----------------------|----------------------------------------------------------------------------------------------------------------------------|
| [OID4VP]              | [OpenID for Verifiable Presentations 1.0](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html)             |
| [OID4VCI]             | [OpenID for Verifiable Credential Issuance 1.0](https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0.html) |
| [PSD2]                | [Directive (EU) 2015/2366 on payment services in the internal market](https://eur-lex.europa.eu/eli/dir/2015/2366/)        |
| [RFC2119]             | [RFC 2119 — Key words for use in RFCs](https://www.rfc-editor.org/rfc/rfc2119.html)                                        |
| [RFC8174]             | [RFC 8174 — Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words](https://www.rfc-editor.org/rfc/rfc8174.html)        |
| [RFC4647]             | [RFC 4647 — Matching of Language Tags](https://www.rfc-editor.org/rfc/rfc4647.html)                                        |
| [RFC5646]             | [RFC 5646 — Tags for Identifying Languages](https://www.rfc-editor.org/rfc/rfc5646.html)                                   |
| [RFC7519]             | [RFC 7519 — JSON Web Token (JWT)](https://www.rfc-editor.org/rfc/rfc7519.html)                                             |
| [SD-JWT-VC]           | [SD-JWT-based Verifiable Credentials](https://datatracker.ietf.org/doc/draft-ietf-oauth-sd-jwt-vc/)                        |
| [mdoc]                | [ISO/IEC 18013-5:2021 — Mobile driving licence application](https://www.iso.org/standard/69084.html)                       |
| [PaSO Proof Metadata] | [PaSO Proof: Metadata Module](proof/paso-proof-metadata.md)                                                                |
| [PaSO View]           | [PaSO View](paso-view.md)                                                                                                  |
| [PaSO Risk Signals]   | [PaSO Proof: Risk Signals Module](proof/paso-proof-risk-signals.md)                                                         |
| [PaSO Risk Signal Registry] | [PaSO Proof: Risk Signal Registry](proof/paso-proof-risk-signal-registry.md)                                         |
| [PaSO Proof Verify]   | [PaSO Proof: Verify Module](proof/paso-proof-verify.md)                                                                    |
| [JAR]                 | [RFC 9101 — JWT-Secured Authorization Request](https://www.rfc-editor.org/rfc/rfc9101.html)                                |
| [W3C.SRI]             | [Subresource Integrity](https://www.w3.org/TR/SRI/)                                                                        |

## Annex A: Examples

_**Note**: This annex is **informative**._

### A.1 Presentation Request

An [OID4VP] presentation request with PaSO transaction data. The `transaction_data` entry is shown decoded; in the actual request it is base64url-encoded.

**DCQL query:**

```json
{
  "dcql_query": {
    "credentials": [
      {
        "id": "sca_card",
        "format": "dc+sd-jwt",
        "meta": { "vct_values": ["https://bank.example/sca/card"] },
        "claims": [
          { "path": ["pan_last_four"] },
          { "path": ["scheme"] }
        ]
      }
    ]
  }
}
```

**Decoded `transaction_data` entry:**

```json
{
  "type": "urn:paso:sca:global:payment:1",
  "credential_ids": ["sca_card"],
  "payload": {
    "transaction_id": "ab9c4d5e-6f78-9012-3456-789abcdef012",
    "amount": "49.99 EUR",
    "payee": {
      "name": "Shop Inc.",
      "id": "DE98ZZZ09999999999"
    }
  }
}
```

### A.2 KB-JWT Payload (SD-JWT-VC)

This example assumes a risk signal profile requiring the `response_mode` and authentication-methods signals is in force; absent such a profile the `risk_signals` claim would be absent.

```json
{
  "aud": "x509_san_dns:shop.example.com",
  "iat": 1741269093,
  "nonce": "bUtJdjJESWdmTWNjb011YQ",
  "sd_hash": "Re-CtLZfjGLErKy3eSriZ4bBx3AtUH5Q5wsWiiWKIwY",
  "jti": "deeec2b0-3bea-4477-bd5d-e3462a709481",
  "display_locale": "de",
  "render_mode": "dynamic",
  "transaction_data_hash": "OJcnQQByvV1iTYxiQQQx4dact-TNnSG-Ku_cs_6g55Q",
  "transaction_data_hash_alg": "sha-256",
  "metadata_integrity": "sha256-K3L5x7nMqYdP2fR8vQwJ1bHgT9sUcA4eZpXo6yD0mEk=",
  "request_integrity": "sha256-7Hn3B4x9f2kLmNpQrStUvWxYz0123456789abcdefg=",
  "wallet_instance_version": "android:com.example.wallet:4.1.2",
  "risk_signals": [
    {
      "type": "urn:paso:risk:global:response_mode:1",
      "collected_at": "2026-07-24T10:15:30Z",
      "status": "ok",
      "value": "direct_post.jwt"
    },
    {
      "type": "urn:paso:risk:global:amr:1",
      "collected_at": "2026-07-24T10:15:30Z",
      "status": "ok",
      "value": ["pin", "hwk", "bio_strong", "face"]
    }
  ]
}
```

### A.3 mdoc DeviceSigned Namespace

CBOR diagnostic notation:

```cbor-diag
"urn:paso:sca:1" : {
  "jti" : "deeec2b0-3bea-4477-bd5d-e3462a709481",
  "display_locale" : "de",
  "render_mode" : "dynamic",
  "transaction_data_hash" : h'3897274100F2BD5D624D8C624104310431E75C76EF...',
  "transaction_data_hash_alg" : "sha-256",
  "metadata_integrity" : "sha256-K3L5x7nMqYdP2fR8vQwJ1bHgT9sUcA4eZpXo6yD0mEk=",
  "request_integrity" : "sha256-7Hn3B4x9f2kLmNpQrStUvWxYz0123456789abcdefg=",
  "wallet_instance_version" : "android:com.example.wallet:4.1.2",
  "risk_signals" : [
    {
      "type" : "urn:paso:risk:global:response_mode:1",
      "collected_at" : "2026-07-24T10:15:30Z",
      "status" : "ok",
      "value" : "direct_post.jwt"
    },
    {
      "type" : "urn:paso:risk:global:amr:1",
      "collected_at" : "2026-07-24T10:15:30Z",
      "status" : "ok",
      "value" : ["pin", "hwk", "bio_strong", "face"]
    }
  ]
}
```

### A.4 Consent Screen

How a Wallet might display the transaction from Annex A.1 with locale `en`:

```
┌──────────────────────────────────────────┐
│  Payment Confirmation                    │
│                                          │
│  Amount            49.99 EUR             │
│  Payee             Shop Inc.             │
│                                          │
│  ┌──────────────┐  ┌──────────────┐      │
│  │     Pay      │  │    Cancel    │      │
│  └──────────────┘  └──────────────┘      │
└──────────────────────────────────────────┘
```

### A.5 Advanced Profile — Multiple Transaction Data Entries

A Relying Party accepts either a card or an account PaSO Credential, and optionally a PID. Each `transaction_data` entry targets a different credential via `credential_ids`:

```json
{
  "dcql_query": {
    "credentials": [
      {
        "id": "sca_card",
        "format": "dc+sd-jwt",
        "meta": { "vct_values": ["https://bank.example/sca/card"] }
      },
      {
        "id": "sca_account",
        "format": "dc+sd-jwt",
        "meta": { "vct_values": ["https://bank.example/sca/account"] }
      },
      {
        "id": "pid",
        "format": "dc+sd-jwt",
        "meta": { "vct_values": ["https://credentials.example/pid"] },
        "claims": [
          { "path": ["given_name"] },
          { "path": ["family_name"] }
        ]
      }
    ],
    "credential_sets": [
      {
        "options": [
          ["sca_card", "pid"],
          ["sca_card"],
          ["sca_account", "pid"],
          ["sca_account"]
        ]
      }
    ]
  }
}
```

Decoded `transaction_data` entries:

```json
[
  {
    "type": "urn:paso:sca:global:payment:1",
    "credential_ids": ["sca_card"],
    "payload": {
      "transaction_id": "ab9c4d5e-6f78-9012-3456-789abcdef012",
      "amount": "49.99 EUR",
      "payee": { "name": "Shop Inc.", "id": "DE98ZZZ09999999999" }
    }
  },
  {
    "type": "urn:paso:sca:global:payment:1",
    "credential_ids": ["sca_account"],
    "payload": {
      "transaction_id": "ab9c4d5e-6f78-9012-3456-789abcdef012",
      "amount": "49.99 EUR",
      "payee": { "name": "Shop Inc.", "id": "DE98ZZZ09999999999" }
    }
  }
]
```

The four alternatives decompose into _S₁_ = {`sca_card`, `sca_account`}, _S₂_ = {`pid`, ∅}. The user independently chooses which PaSO Credential to use and whether to include the PID. When the user switches from `sca_card` to `sca_account`, the displayed transaction data updates to reflect the entry matched for that credential.

### A.6 Advanced Profile — Transposability

_**Example (transposable):**_ A Relying Party accepts one PaSO Credential (`sca_card`) and optionally requests a PID from two possible issuers (`pid_1` and `pid_2`):

```json
"options": [
  ["sca_card", "pid_1"],
  ["sca_card", "pid_2"],
  ["sca_card"]
]
```

This decomposes into _S₁_ = {`sca_card`}, _S₂_ = {`pid_1`, `pid_2`, ∅}. The user is presented two independent choices: `sca_card` (mandatory), and optionally which PID to include.

---

_**Counterexample (not transposable):**_ The Relying Party also optionally accepts a `loyalty` credential, but only in combination with `pid_2`:

```json
"options": [
  ["sca_card", "pid_1"],
  ["sca_card", "pid_2", "loyalty"],
  ["sca_card"]
]
```

The only candidate decomposition would be _S₁_ = {`sca_card`}, _S₂_ = {`pid_1`, `pid_2`, ∅}, _S₃_ = {`loyalty`, ∅}, which requires six alternatives, not three. The Relying Party has created an artificial dependency between `loyalty` and `pid_2`. A Wallet **SHALL** reject this request.

To make it transposable, the Relying Party must include all six combinations:

```json
"options": [
  ["sca_card", "pid_1", "loyalty"],
  ["sca_card", "pid_1"],
  ["sca_card", "pid_2", "loyalty"],
  ["sca_card", "pid_2"],
  ["sca_card", "loyalty"],
  ["sca_card"]
]
```

### A.7 Advanced Profile — Versioned Transaction Data

A Relying Party has migrated its transaction type from version 1 to version 2, which adds an optional `reward_points` claim. The Relying Party lists the newer type first so that credentials supporting it use the richer payload, while older credentials fall back to v1:

Decoded `transaction_data` entries:

```json
[
  {
    "type": "urn:paso:sca:com.example.pay:transaction:2",
    "credential_ids": ["sca"],
    "payload": {
      "transaction_id": "ab9c4d5e-6f78-9012-3456-789abcdef012",
      "amount": "49.99 EUR",
      "payee": { "name": "Example Shop", "id": "DE98ZZZ09999999999" },
      "reward_points": "150"
    }
  },
  {
    "type": "urn:paso:sca:com.example.pay:transaction:1",
    "credential_ids": ["sca"],
    "payload": {
      "transaction_id": "ab9c4d5e-6f78-9012-3456-789abcdef012",
      "amount": "49.99 EUR",
      "payee": { "name": "Example Shop", "id": "DE98ZZZ09999999999" }
    }
  }
]
```

Both entries target the same `credential_ids`. When the Wallet evaluates the user's credential:

- If the credential supports `urn:paso:sca:com.example.pay:transaction:2`, the first entry matches and is selected.
- If the credential only supports `urn:paso:sca:com.example.pay:transaction:1`, the first entry is skipped and the second entry is selected.

This allows the Relying Party to roll out a new transaction data version without breaking compatibility with credentials that have not yet been updated.
