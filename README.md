# Payments and SCA for Openid

Payments and SCA for Openid, or PaSO, is a set of standards to bridge the gap between Wallets and European Banking Legislation, by facilitating trust and establishing a strong PSD compliant proof framework.

It is based on the [OpenID4VP](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html) and [OpenID4VCI](https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0.html) standards.

## Specifications

- [PaSO Core](specs/paso-core.md)
- [PaSO Proof: Metadata Module](specs/proof/paso-proof-metadata.md)

## Overview

The project is composed of the following standards:

- **PaSO Core**: Establishes the common guideline for trust and interoperability within PaSO:
    - **Roles**: Defines the roles participating in PaSO transactions, including the Authorizing Party.
    - **Flows**: Describes the first-party and third-party flow types.
    - **Credential Rulebooks**: Governance documents for credential types used with PaSO.
    - **Transaction Data Type Rulebooks**: Governance documents defining the semantic structure of transaction data types.
    - **Holder Binding Proof**: The proof structure produced by the Wallet and consumed by the Authorizing Party to verify the transaction.
    - **Transaction Data Processing**: How wallets process transaction data, with a simple profile and an advanced profile supporting credential sets and versioned fallback.
- **PaSO Proof**: Establishes modular guidelines for producing a verifiable and replayable proof package.
    - **Core Module**: Defines the requirements to ensure a secure and deterministic presentation process.
    - **Trust Module**: Defines a standardized way to handle trust automatically within the PaSO Ecosystem.
    - **Verify Module**: Defines the service provider proof package format and verification procedures.
    - **Log Module**: Defines the wallet requirements for transaction logs.
    - **Status Module**: Defines a standardized backchannel to wallets for transaction status.
    - **Metadata Module**: Defines how to produce and consume verifiable issuer metadata.
    - **SD-JWT-VC and SVG Module**: Profile for SD-JWT-VC and SVG ensuring metadata is securely queried and verified before display.
- **PaSO View**: Defines a way to dynamically define transaction types to ensure universal support across all supporting wallets.

Many of these standards have the ability to be extended by further standards, and can be swapped with other standards provided they are accepted by the involved parties.