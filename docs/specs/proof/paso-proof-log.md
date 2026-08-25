# Log Module

## Abstract

This document defines the audit logging requirements for PaSO. It specifies what the Wallet must retain for each PaSO Credential and each PaSO transaction to enable a full user-side audit trail.

## 1 Introduction

This module defines a user-side audit log for PaSO. It does not mandate a particular storage format or schema. It specifies what data the Wallet must retain so that any transaction can be independently reconstructed and verified.

### 1.1 Requirements Notation

The key words "**MUST**", "**MUST NOT**", "**REQUIRED**", "**SHALL**", "**SHALL NOT**", "**SHOULD**", "**SHOULD NOT**", "**RECOMMENDED**", "**MAY**", and "**OPTIONAL**" in this document are to be interpreted as described in [RFC2119] and [RFC8174] when, and only when, they are written in all capital letters.

## 2 Credential Storage

For each PaSO Credential, the Wallet **SHALL** store the following artefacts together:

1. **The credential itself**, in the format as received from the Attestation Provider.

2. **Metadata history**: all signed credential metadata JWTs (per [PaSO Proof Metadata]) used during presentations, including all locale variants.

3. **Resolved resources**: all external resources resolved for this credential — including SVG templates, resources embedded within SVG documents (per [PaSO Proof SD-JWT-VC and SVG]), and any other resource fetched for credential display. For each resource, the Wallet **SHALL** store:
   - the URL from which the resource was retrieved,
   - the resource content,
   - its [W3C.SRI] integrity value,
   - the date and time of retrieval.

## 3 Transaction Storage

For each [OID4VP] presentation session involving PaSO transaction data, whether completed or not, the Wallet **SHALL** store:

1. **The [OID4VP] Authorization Request** as received by the Wallet.

2. **The full `vp_token`** as delivered to the Relying Party. If the transaction was not completed, whatever was produced at the point of abandonment, or nothing if no token was generated.

3. **Resolved resources**: all external resources resolved during the transaction — including SVG templates, resources embedded within SVG documents, and any other resource fetched for transaction display. For each resource, the Wallet **SHALL** store:
   - the URL from which the resource was retrieved,
   - the resource content,
   - its [W3C.SRI] integrity value,
   - the date and time of retrieval.

4. **The date and time** of the transaction.

## 4 Export

The Wallet **MAY** support exporting the transaction log and credential artefacts.

## 5 Replayability

The Wallet **SHOULD** provide a mechanism to replay the full presentation request exactly as it happened at that time, with the credential choices set to the ones that were chosen at that time.

## 6 References

| Reference                        | Description                                                                                                                |
|----------------------------------|----------------------------------------------------------------------------------------------------------------------------|
| [PaSO Core]                      | [PaSO Core](../paso-core.md)                                                                                               |
| [PaSO Proof Metadata]            | [PaSO Proof: Metadata Module](paso-proof-metadata.md)                                                                      |
| [PaSO Proof SD-JWT-VC and SVG]   | [PaSO Proof: SD-JWT-VC and SVG Module](paso-proof-sd-jwt-vc-svg.md)                                                        |
| [OID4VP]                         | [OpenID for Verifiable Presentations 1.0](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html)             |
| [RFC2119]                        | [RFC 2119 — Key words for use in RFCs](https://www.rfc-editor.org/rfc/rfc2119.html)                                        |
| [RFC8174]                        | [RFC 8174 — Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words](https://www.rfc-editor.org/rfc/rfc8174.html)        |
| [W3C.SRI]                        | [Subresource Integrity](https://www.w3.org/TR/SRI/)                                                                        |
