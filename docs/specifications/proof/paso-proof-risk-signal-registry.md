# Risk Signal Registry

## Abstract

This document is the normative catalogue of risk signal types in the `global` domain. Each entry defines a signal type URN, the structure of its `value`, and any processing rules specific to that type. It carries no framework requirements: the signal envelope, the collection trigger, transport, verification, and encryption are defined by [PaSO Risk Signals], and the bundling of signal types into referencable sets is defined by risk signal profiles ([PaSO Risk Signals] Section 3).

## 1 Introduction

### 1.1 Overview

[PaSO Risk Signals] defines the mechanism by which a Wallet collects device, environment, and transaction observations and carries them to the Authorizing Party in the holder binding proof. This document defines the vocabulary those mechanisms operate on. Separating the two allows a signal type to be added, or a new domain's catalogue to be published, without amending the framework.

Signal types are referenced by risk signal profiles, which bundle them with a requirement flag and an optional freshness bound. A profile **SHALL** reference only signal types whose definition is published.

### 1.2 Scope

This document defines signal types in the `global` domain. It does not define the signal envelope, how collection is triggered, how signals are transported or encrypted, or how the Authorizing Party verifies them — all of which are defined by [PaSO Risk Signals]. Organisations **MAY** publish signal types in their own domain following the identifier structure of [PaSO Risk Signals] Section 2.1.

### 1.3 Requirements Notation

The key words "**MUST**", "**MUST NOT**", "**REQUIRED**", "**SHALL**", "**SHALL NOT**", "**SHOULD**", "**SHOULD NOT**", "**RECOMMENDED**", "**MAY**", and "**OPTIONAL**" in this document are to be interpreted as described in [RFC2119] and [RFC8174] when, and only when, they are written in all capital letters.

## 2 Signal Types

Each entry below defines a signal type URN and the structure of its `value`. The `value` is present if and only if `status` is `ok`, per [PaSO Risk Signals] Section 2.2.

Signal types divide into two kinds, which differ in how `status` and `collected_at` behave:

- **Measured signals** (Sections 2.1 to 2.3) report a sensor or platform observation. Measurement can fail or be refused, so `status` **MAY** be `unavailable` or `denied`, and `collected_at` is the time of measurement.
- **Transaction-fact signals** (Sections 2.4 and 2.5) report something the Wallet already knows from processing the transaction. No sensor and no permission is involved, so a Wallet that implements the type **SHALL** report `status` `ok`.

### 2.1 Geolocation

Type: `urn:paso:risk:global:geolocation:1`

A measured signal. The `value` is an object with the following members:

| Member     | Required | Description                                        |
|------------|----------|----------------------------------------------------|
| `lat`      | yes      | WGS84 latitude in decimal degrees.                 |
| `lon`      | yes      | WGS84 longitude in decimal degrees.                |
| `accuracy` | yes      | Horizontal accuracy radius in metres.              |
| `altitude` | no       | Altitude in metres.                                |
| `source`   | no       | One of `gnss`, `network`, or `fused`.              |

### 2.2 Call Activity

Type: `urn:paso:risk:global:call_activity:1`

A measured signal. The `value` is an object with the following members:

| Member              | Required | Description                                                            |
|---------------------|----------|-----------------------------------------------------------------------|
| `call_state`        | yes      | One of `idle`, `ringing`, or `active`.                                 |
| `direction`         | no       | One of `incoming`, `outgoing`, or `unknown`.                           |
| `call_active_since` | no       | An [ISO8601] timestamp indicating when the current call became active. |

### 2.3 Device Orientation & Motion

Type: `urn:paso:risk:global:device_motion:1`

A measured signal. The `value` reports current device orientation and a bounded statistical summary of motion over a short sampling window. No interpretation (such as "walking") is performed by the Wallet.

| Member          | Required | Description                                                                                              |
|-----------------|----------|--------------------------------------------------------------------------------------------------------|
| `window_ms`     | yes      | Length of the sampling window in milliseconds.                                                          |
| `orientation`   | yes      | Object with `pitch`, `roll`, and `yaw`, each the device attitude angle in degrees.                      |
| `acceleration`  | yes      | Object with `rms` and `max`, each the user-acceleration magnitude in *g* over the window.               |
| `rotation_rate` | yes      | Object with `rms` and `max`, each the gyroscope rotation-rate magnitude in radians per second over the window. |

### 2.4 Response Mode

Type: `urn:paso:risk:global:response_mode:1`

A transaction-fact signal. The `value` is a string: the `response_mode` parameter as given or defaulted in the [OID4VP] Authorization Request.

A Wallet that implements this signal type **SHALL** report `status` `ok` and **SHALL** set `collected_at` to the time at which it processed the Authorization Request.

The Authorizing Party verifies this value against the Authorization Request it received, per [PaSO Proof Verify] Section 3.

### 2.5 Authentication Methods

Type: `urn:paso:risk:global:amr:1`

A transaction-fact signal. The `value` is a JSON array of strings reporting the authentication methods by which the user released the transaction.

Values from the IANA "Authentication Method Reference Values" registry [RFC8176] **SHALL** be used where applicable. Common values include `pin`, `pwd`, `hwk`, `swk`, and `otp`.

This document defines two additional values for biometric strength:

| Value        | Criteria                                                                                                                                 |
|--------------|------------------------------------------------------------------------------------------------------------------------------------------|
| `bio_strong` | Biometric matching in hardware-isolated environment (e.g., TEE, Secure Element); FAR ≤ 1:50,000; presentation attack detection required. |
| `bio_weak`   | Biometric matching with FAR ≤ 1:10,000; does not meet `bio_strong` criteria.                                                             |

When a biometric factor is used, the Wallet **SHALL** include exactly one of `bio_strong` or `bio_weak`. The Wallet **SHOULD** additionally include the modality value (`fpt`, `face`, `iris`) when the platform identifies it.

When used in a [PSD2] context, the `value` array **SHALL** cover at least two different categories of authentication elements (knowledge, possession, inherence) as required by [PSD2] Article 4(30).

A Wallet that implements this signal type **SHALL** report `status` `ok` and **SHALL** set `collected_at` to the time at which the user completed authentication.

[PaSO Core] does not require this signal. An ecosystem that requires Strong Customer Authentication **SHALL** publish a risk signal profile ([PaSO Risk Signals] Section 3) that includes this signal type with `required` set to `true`, and **SHOULD** observe the encryption advisory in [PaSO Risk Signals] Section 7.8.

## 3 References

| Reference           | Description                                                                                                         |
|---------------------|---------------------------------------------------------------------------------------------------------------------|
| [PaSO Core]         | [PaSO Core](../paso-core.md)                                                                                        |
| [PaSO Risk Signals] | [PaSO Proof: Risk Signals Module](paso-proof-risk-signals.md)                                                       |
| [PaSO Proof Verify] | [PaSO Proof: Verify Module](paso-proof-verify.md)                                                                   |
| [OID4VP]            | [OpenID for Verifiable Presentations 1.0](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html)      |
| [PSD2]              | [Directive (EU) 2015/2366 on payment services in the internal market](https://eur-lex.europa.eu/eli/dir/2015/2366/) |
| [RFC2119]           | [RFC 2119 — Key words for use in RFCs](https://www.rfc-editor.org/rfc/rfc2119.html)                                 |
| [RFC8174]           | [RFC 8174 — Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words](https://www.rfc-editor.org/rfc/rfc8174.html) |
| [RFC8176]           | [RFC 8176 — Authentication Method Reference Values](https://www.rfc-editor.org/rfc/rfc8176.html)                     |
| [ISO8601]           | [ISO 8601 — Date and time format](https://www.iso.org/iso-8601-date-and-time-format.html)                           |
