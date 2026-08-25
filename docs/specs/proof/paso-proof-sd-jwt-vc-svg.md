# SD-JWT-VC and SVG Module

## Abstract

This document defines how Wallets resolve display metadata for PaSO Credentials in [SD-JWT-VC] format. It establishes metadata source priority and additional integrity requirements for SVG resources beyond those defined in [SD-JWT-VC].

## 1 Introduction

### 1.1 Overview

[PaSO Proof Metadata] requires signed credential metadata for PaSO Credentials. For [SD-JWT-VC] credentials, the Type Metadata already provides display information with its own integrity mechanism. This module defines when and how [SD-JWT-VC] Type Metadata can be used as an alternative to signed credential metadata for display, and adds integrity requirements for resources embedded within SVG templates.

### 1.2 Requirements Notation

The key words "**MUST**", "**MUST NOT**", "**REQUIRED**", "**SHALL**", "**SHALL NOT**", "**SHOULD**", "**SHOULD NOT**", "**RECOMMENDED**", "**MAY**", and "**OPTIONAL**" in this document are to be interpreted as described in [RFC2119] and [RFC8174] when, and only when, they are written in all capital letters.

## 2 Metadata Source Priority

As an exception to [PaSO Proof Metadata], the Wallet **MAY** use integrity-verified [SD-JWT-VC] Type Metadata for display purposes without requiring a signed credential metadata JWT for the display information.

When displaying a PaSO Credential in [SD-JWT-VC] format, the Wallet **SHALL** resolve display metadata following the priority order defined in [OID4VCI] Section 12.2.4. [SD-JWT-VC] integrity verification is always required in a PaSO context; any resource that is not integrity-verified **SHALL** be considered absent.

## 3 SVG Embedded Resource Integrity

SVG template retrieval, integrity verification, and placeholder substitution **SHALL** follow [SD-JWT-VC] Sections 7 and 8.

In addition, URLs within SVG documents loaded in a PaSO context (e.g., images, fonts referenced inside the SVG markup) **SHALL** carry a [W3C.SRI] integrity value in the URL fragment, percent-encoded (e.g., `https://example.com/logo.png#sha256-abc123`). The Wallet **SHALL** verify each such resource by:

1. Extracting and percent-decoding the fragment to obtain the integrity value.
2. Fetching the resource from the URL (without the fragment).
3. Verifying the fetched content against the integrity value.

If the fragment is missing, invalid, or verification fails, the SVG document **SHALL** be discarded and the Wallet **SHALL** use an available fallback. If no fallback is available, the resource **SHALL** be considered invalid.

## 4 References

| Reference             | Description                                                                                                                |
|-----------------------|----------------------------------------------------------------------------------------------------------------------------|
| [PaSO Core]           | [PaSO Core](../paso-core.md)                                                                                               |
| [PaSO Proof Metadata] | [PaSO Proof: Metadata Module](paso-proof-metadata.md)                                                                      |
| [OID4VCI]             | [OpenID for Verifiable Credential Issuance 1.0](https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0.html) |
| [SD-JWT-VC]           | [SD-JWT-based Verifiable Credentials](https://datatracker.ietf.org/doc/draft-ietf-oauth-sd-jwt-vc/)                        |
| [RFC2119]             | [RFC 2119 — Key words for use in RFCs](https://www.rfc-editor.org/rfc/rfc2119.html)                                        |
| [RFC8174]             | [RFC 8174 — Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words](https://www.rfc-editor.org/rfc/rfc8174.html)        |
| [W3C.SRI]             | [Subresource Integrity](https://www.w3.org/TR/SRI/)                                                                        |
