# Payments and SCA for Openid

Payments and SCA for Openid, or PaSO, is a set of standards to bridge the gap between Wallets and European Banking Legislation, by facilitating trust and establishing a strong PSD compliant proof framework.

It is based on the [OpenID4VP](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html) and [OpenID4VCI](https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0.html) standards.

The project is composed of the following standards:

- **PaSO Core**: Establishes the common guideline for trust and interoperability within PaSO based on:
    - **Roles**: Defines the roles and their purpose in PaSO.
    - **Ecosystem**: How to communicate and detect PaSO features.
    - **Credential Rulebooks**: How to define the rules for issuing, displaying and verifying credentials.
    - **Transaction Data Type Rulebooks**: How to define the rules for Usage, Display and validation of Transaction Data Types.
    - **Holder Binding Proof Standardization**: The Holder binding proof is the structure that is produced by a presentation and is ingested by the payment networks or banks to settle the transaction.
    - **Transaction Data Processing Standardization**: OpenID4VP leaves the handling of `transaction_data` open. This ensures a deterministic, flexible, interoperable and future-compatible standard for handling transaction data. It also ensures that consent options are always easily and fully representable by a wallet.
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