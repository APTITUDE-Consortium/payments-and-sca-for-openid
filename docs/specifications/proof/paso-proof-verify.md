# Verify Module

## Abstract

This document defines how an Authorizing Party receives, verifies, and authorizes a PaSO transaction. It specifies the proof package structure forwarded by the Relying Party, the verification procedure, and a standard endpoint for ingesting transactions.

## 1 Introduction

### 1.1 Overview

After the Wallet produces a presentation response, the Relying Party forwards the proof package to the Authorizing Party. This module defines what the proof package contains, how the Authorizing Party verifies it, and a standard HTTP endpoint for receiving it.

How the Relying Party obtains the Authorizing Party's public key and endpoint URI, and how the Authorizing Party establishes trust in the certificate of the party forwarding the proof package, are out of scope of this document.

### 1.2 Requirements Notation

The key words "**MUST**", "**MUST NOT**", "**REQUIRED**", "**SHALL**", "**SHALL NOT**", "**SHOULD**", "**SHOULD NOT**", "**RECOMMENDED**", "**MAY**", and "**OPTIONAL**" in this document are to be interpreted as described in [RFC2119] and [RFC8174] when, and only when, they are written in all capital letters.

## 2 Proof Package

The Relying Party **SHALL** forward the following to the Authorizing Party:

1. **The signed [OID4VP] Authorization Request** ([JAR] Request Object) as sent to the Wallet, in its compact-serialised JWT form.
2. **The full `vp_token`** as received from the Wallet.

The Relying Party **SHALL NOT** modify either artefact. Section 4 proposes a standard endpoint for forwarding; a payment scheme or the applicable Transaction Data Type Rulebook **MAY** define alternative forwarding mechanisms.

## 3 Verification Procedure

Upon receiving the proof package, the Authorizing Party **SHALL** perform the following checks:

1. **Request verification**: Verify the signed Authorization Request JWT signature. Verify the Relying Party's identity from the request.

2. **Credential verification**: Verify the PaSO Credential in the `vp_token`:
   - Validate the credential signature.
   - Verify the credential has not expired.
   - Verify the credential has not been revoked.

3. **Holder binding proof verification**: Verify the holder binding proof (KB-JWT for [SD-JWT-VC], DeviceAuthentication for [mdoc]).

4. **SCA response claims verification** per [PaSO Core] Section 6.1:
   - `transaction_data_hash`: recompute the hash from the `transaction_data` entry in the Authorization Request and verify it matches.
   - `transaction_data_hash_alg`: verify the algorithm is acceptable.
   - `request_integrity`: recompute the [W3C.SRI] integrity value of the signed Authorization Request JWT and verify it matches.
   - `metadata_integrity`: verify it matches the [W3C.SRI] integrity value of the Attestation Provider's current signed credential metadata JWT for this credential.
   - `render_mode`: verify that it is either `dynamic` or `static`. If it is `static`, verify that the applicable Transaction Data Type Rulebook contains a Static Presentation section per [PaSO Core] Section 5.3, and that the `transaction_data` entry does not carry a `metadata` parameter, per [PaSO View] Section 5.1.
   - `display_locale`, if `render_mode` is `dynamic`: verify that it is either the string `default` or a [RFC5646] language tag. If it is `default`, verify that every claim `display` array and every `ui_labels` entry array of the matched transaction data type in the credential metadata contains a default entry (an entry without a `locale`). Otherwise, verify that every such array contains an entry whose `locale` equals `display_locale`, compared case-insensitively.
   - `display_locale`, if `render_mode` is `static`: verify that it is a [RFC5646] language tag and not the string `default`. If the matched transaction data type in the credential metadata has a `security_hint`, verify that its entry array contains an entry whose `locale` equals `display_locale`, compared case-insensitively, per [PaSO View] Section 5.4.
   - `jti`: verify uniqueness (the Authorizing Party **SHOULD** maintain a replay cache).
   - Ad-hoc metadata: where this step refers to the credential metadata of the matched transaction data type and the `transaction_data` entry in the Authorization Request carries a `metadata` parameter, the Authorizing Party **SHALL** instead use that `metadata` object. Before doing so, it **SHALL** verify, per [PaSO Proof Metadata] Section 5.3, that the `client_id` of the Authorization Request is listed in `adhoc_metadata_clients` of the signed credential metadata JWT identified by `metadata_integrity`, that the entry's `type` is not listed in `transaction_data_types` of that JWT, and that the `metadata` object conforms to [PaSO Proof Metadata] Sections 3.1 to 3.3.

5. **Payload verification**: Verify that the `transaction_data` entry's `payload` conforms to the applicable Transaction Data Type Rulebook. The specific checks are defined by the rulebook. Where the type has no rulebook because it is used only with ad-hoc metadata ([PaSO Core] Section 5.1), verify instead that the `payload` conforms to the `metadata` object of the entry, per [PaSO Core] Section 7.5 condition 3.

6. **Risk-signals verification** per [PaSO Risk Signals] Section 6:
   - Resolve the effective signal set for the matched transaction data type per [PaSO Risk Signals] Section 4.1: the union of every referenced risk signal profile, then tightened by any metadata or rulebook enumeration. Signal types are defined by [PaSO Risk Signal Registry].
   - Verify that every signal resolved as required is present in the `risk_signals` claim, with any `status`. The absence of a signal that did not resolve as required **SHALL NOT** be treated as a failure.
   - Verify each envelope is well-formed and that its `collected_at` is no older than the `max_age` resolved for that signal, measured from the time the proof package was received and allowing for reasonable clock skew and forwarding delay. Where no `max_age` was resolved, the acceptable window is a matter of Transaction Data Type Rulebook or Authorizing Party policy.
   - When `urn:paso:risk:global:response_mode:1` is present, verify that its value matches the `response_mode` of the received Authorization Request.
   - Interpreting signal values to reach a risk decision is out of scope and left to Authorizing Party policy.
   - When encryption is required for the transaction data type, verify that the `risk_signals` value is an encrypted structure and reject a plaintext value; the presence, well-formedness, freshness, and signal-specific checks above are performed by the holder of the issuer decryption key after decryption, as defined in [PaSO Risk Signals] Section 6.1.

If any check fails, the Authorizing Party **SHALL** reject the transaction.

## 4 Transaction Ingestion Endpoint

This section proposes an HTTP endpoint that an Authorizing Party **MAY** expose for receiving proof packages. It is a proposal for interoperable forwarding, not the only mechanism. In the third-party flow, forwarding is typically governed by a payment scheme, and a payment scheme or the applicable Transaction Data Type Rulebook **MAY** define a different mechanism. Sections 2 and 3 apply whichever mechanism is used.

In this section, the sender is the Relying Party or a party forwarding the proof package on its behalf.

### 4.1 Request

The sender **SHALL** send an HTTP `POST` request to the endpoint with:

- **Content-Type**: `application/jose`.
- **Body**: the envelope defined in Section 4.3, which is a signed JWT or a JWE containing it.

The payload of the signed JWT **SHALL** be a JSON object with the following structure:

```json
{
  "signed_request": "<compact-serialised Authorization Request JWT>",
  "vp_token": "<vp_token as received from the Wallet>"
}
```

- **`signed_request`**: **REQUIRED**. The signed [OID4VP] Authorization Request in compact JWT serialisation.
- **`vp_token`**: **REQUIRED**. The `vp_token` as received from the Wallet.

### 4.2 Response

The endpoint **SHALL** respond with:

- `200 OK` — the transaction was accepted.
- `400 Bad Request` — the proof package is malformed or a verification check failed. The response body **SHOULD** be a JSON object with an `error` field describing the failure.
- `401 Unauthorized` — the envelope signature could not be verified, its `typ` is not `paso-proof-package+jwt`, or the Authorizing Party does not trust the certificate chain in its `x5c` header parameter (Section 4.3).
- `409 Conflict` — the `jti` has already been processed (replay).

### 4.3 Envelope

The sender **SHALL** sign the proof package and **SHOULD** encrypt it.

**Signing.** The sender **SHALL** produce a [JWS] in compact serialisation whose payload is the JSON object defined in Section 4.1. The JWS protected header **SHALL** include:

- `alg`: the signature algorithm;
- `typ`: the value `paso-proof-package+jwt`;
- `x5c`: the sender's certificate chain, whose leaf certificate contains the signing key.

**Encryption.** To encrypt, the sender **SHALL** nest the signed JWT in a [JWE] in compact serialisation, per [JWT] Section 5.2, encrypted to the Authorizing Party's public key so that only the Authorizing Party can decrypt it. The JWE protected header **SHALL** include `alg` (key management), `enc` (content encryption), `kid` (the Authorizing Party's key), and `cty` with the value `JWT`. When encryption is used, the sender and the Authorizing Party **SHALL** support `ECDH-ES` key agreement using the `P-256` curve with `A256GCM` content encryption, per [RFC7518], as a baseline. Other algorithms **MAY** be used when the Authorizing Party's key declares them.

**Processing.** On receipt, the Authorizing Party **SHALL**:

1. If the body is a JWE (five compact segments), decrypt it and take the plaintext as the signed JWT. If decryption fails, respond `400`.
2. Verify the signed JWT's signature with the key in the leaf certificate of `x5c`, verify that `typ` is `paso-proof-package+jwt`, and verify that it trusts the `x5c` certificate chain. If any of these fails, respond `401`.
3. Perform the verification procedure of Section 3 on the proof package in the payload. If it fails, respond `400`.

## 5 References

| Reference             | Description                                                                                                                |
|-----------------------|----------------------------------------------------------------------------------------------------------------------------|
| [PaSO Core]           | [PaSO Core](../paso-core.md)                                                                                               |
| [PaSO Proof Metadata] | [PaSO Proof: Metadata Module](paso-proof-metadata.md)                                                                      |
| [PaSO View]           | [PaSO View](../paso-view.md)                                                                                               |
| [PaSO Risk Signals]   | [PaSO Proof: Risk Signals Module](paso-proof-risk-signals.md)                                                              |
| [PaSO Risk Signal Registry] | [PaSO Proof: Risk Signal Registry](paso-proof-risk-signal-registry.md)                                                     |
| [OID4VP]              | [OpenID for Verifiable Presentations 1.0](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html)             |
| [JAR]                 | [RFC 9101 — JWT-Secured Authorization Request](https://www.rfc-editor.org/rfc/rfc9101.html)                                |
| [JWE]                 | [RFC 7516 — JSON Web Encryption](https://www.rfc-editor.org/rfc/rfc7516.html)                                              |
| [JWS]                 | [RFC 7515 — JSON Web Signature (JWS)](https://www.rfc-editor.org/rfc/rfc7515.html)                                         |
| [JWT]                 | [RFC 7519 — JSON Web Token (JWT)](https://www.rfc-editor.org/rfc/rfc7519.html)                                             |
| [RFC7518]             | [RFC 7518 — JSON Web Algorithms (JWA)](https://www.rfc-editor.org/rfc/rfc7518.html)                                        |
| [SD-JWT-VC]           | [SD-JWT-based Verifiable Credentials](https://datatracker.ietf.org/doc/draft-ietf-oauth-sd-jwt-vc/)                        |
| [mdoc]                | [ISO/IEC 18013-5:2021 — Mobile driving licence application](https://www.iso.org/standard/69084.html)                       |
| [RFC2119]             | [RFC 2119 — Key words for use in RFCs](https://www.rfc-editor.org/rfc/rfc2119.html)                                        |
| [RFC8174]             | [RFC 8174 — Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words](https://www.rfc-editor.org/rfc/rfc8174.html)        |
| [RFC5646]             | [RFC 5646 — Tags for Identifying Languages](https://www.rfc-editor.org/rfc/rfc5646.html)                                   |
| [W3C.SRI]             | [Subresource Integrity](https://www.w3.org/TR/SRI/)                                                                        |
