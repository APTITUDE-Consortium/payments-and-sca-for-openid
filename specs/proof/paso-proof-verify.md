# PaSO Proof: Verify Module

## Abstract

This document defines how an Authorizing Party receives, verifies, and authorizes a PaSO transaction. It specifies the proof package structure forwarded by the Relying Party, the verification procedure, and a standard endpoint for ingesting transactions.

## 1 Introduction

### 1.1 Overview

After the Wallet produces a presentation response, the Relying Party forwards the proof package to the Authorizing Party. This module defines what the proof package contains, how the Authorizing Party verifies it, and a standard HTTP endpoint for receiving it.

The Authorizing Party's public key and endpoint URI are obtained via [PaSO Trust] or the applicable Transaction Data Type Rulebook.

### 1.2 Requirements Notation

The key words "**MUST**", "**MUST NOT**", "**REQUIRED**", "**SHALL**", "**SHALL NOT**", "**SHOULD**", "**SHOULD NOT**", "**RECOMMENDED**", "**MAY**", and "**OPTIONAL**" in this document are to be interpreted as described in [RFC2119] and [RFC8174] when, and only when, they are written in all capital letters.

## 2 Proof Package

The Relying Party **SHALL** forward the following to the Authorizing Party:

1. **The signed [OID4VP] Authorization Request** ([JAR] Request Object) as sent to the Wallet, in its compact-serialised JWT form.
2. **The full `vp_token`** as received from the Wallet.

The Relying Party **SHALL NOT** modify either artefact. Section 4 defines a standard endpoint for forwarding; the applicable Transaction Data Type Rulebook **MAY** define alternative forwarding mechanisms.

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
   - `metadata_integrity`: if present, verify it matches the [W3C.SRI] integrity value of the Attestation Provider's current signed credential metadata JWT for this credential.
   - `amr`: verify the authentication methods meet the requirements of the applicable Transaction Data Type Rulebook.
   - `display_locale`: verify that the locale matches a locale for which the credential metadata provides complete `display` entries.
   - `jti`: verify uniqueness (the Authorizing Party **SHOULD** maintain a replay cache).

5. **Payload verification**: Verify that the `transaction_data` entry's `payload` conforms to the applicable Transaction Data Type Rulebook. The specific checks are defined by the rulebook.

If any check fails, the Authorizing Party **SHALL** reject the transaction.

## 4 Transaction Ingestion Endpoint

The Authorizing Party **MAY** expose an HTTP endpoint for receiving proof packages.

### 4.1 Request

The Relying Party **SHALL** send an HTTP `POST` request to the endpoint with:

- **Content-Type**: `application/jose` when encrypted per Section 4.3, or `application/json` otherwise.
- **Body**: The proof package as defined below.

When the body is `application/json`, it **SHALL** have the following structure:

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
- `401 Unauthorized` — the Relying Party could not be authenticated.
- `409 Conflict` — the `jti` has already been processed (replay).

### 4.3 Encryption

The Relying Party **SHOULD** encrypt the proof package as a [JWE] compact serialisation. The JWE **SHALL** be:

- signed by the Relying Party using its trust chain,
- encrypted to the Authorizing Party's public key, so that only the Authorizing Party can decrypt it.

The JWE payload is the JSON proof package defined in Section 4.1. The JOSE header **SHALL** include the Relying Party's certificate chain in the `x5c` parameter.

How the Relying Party obtains the Authorizing Party's public key is determined by [PaSO Trust] or the applicable Transaction Data Type Rulebook.

## 5 References

| Reference             | Description                                                                                                                |
|-----------------------|----------------------------------------------------------------------------------------------------------------------------|
| [PaSO Core]           | [PaSO Core](../paso-core.md)                                                                                               |
| [PaSO Trust]          | PaSO Trust (forthcoming)                                                                                                   |
| [PaSO Proof Metadata] | [PaSO Proof: Metadata Module](paso-proof-metadata.md)                                                                      |
| [OID4VP]              | [OpenID for Verifiable Presentations 1.0](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html)             |
| [JAR]                 | [RFC 9101 — JWT-Secured Authorization Request](https://www.rfc-editor.org/rfc/rfc9101.html)                                |
| [JWE]                 | [RFC 7516 — JSON Web Encryption](https://www.rfc-editor.org/rfc/rfc7516.html)                                              |
| [SD-JWT-VC]           | [SD-JWT-based Verifiable Credentials](https://datatracker.ietf.org/doc/draft-ietf-oauth-sd-jwt-vc/)                        |
| [mdoc]                | [ISO/IEC 18013-5:2021 — Mobile driving licence application](https://www.iso.org/standard/69084.html)                       |
| [RFC2119]             | [RFC 2119 — Key words for use in RFCs](https://www.rfc-editor.org/rfc/rfc2119.html)                                        |
| [RFC8174]             | [RFC 8174 — Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words](https://www.rfc-editor.org/rfc/rfc8174.html)        |
| [W3C.SRI]             | [Subresource Integrity](https://www.w3.org/TR/SRI/)                                                                        |
