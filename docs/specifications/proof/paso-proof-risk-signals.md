# Risk Signals Module

## Abstract

This document defines an extensible framework for **risk signals** in PaSO: device, environment, and behavioral observations that a Wallet collects and carries to the Authorizing Party as part of a transaction. It specifies a signal envelope, a naming scheme, risk signal profiles as the unit by which signal sets are agreed and referenced, how collection is triggered, how signals are transported in the holder binding proof, and how the Authorizing Party verifies them. Signal types themselves are defined by [PaSO Risk Signal Registry]. Risk signals are Wallet self-asserted and factual; PaSO standardises their structure and carriage but never mandates a risk decision.

## 1 Introduction

### 1.1 Overview

Fraud detection benefits from device and behavioral context — where a device is, whether the user is on a call, whether the device is being physically handled. [PaSO Core] defines the holder binding proof but carries no such signals. This module adds an extensible risk-signal framework whose signals ride the existing holder binding proof signature, so no additional signing infrastructure is required.

Risk signals are **self-asserted** by the Wallet: they inherit the Wallet's key-binding signature and carry no independent attestation. The Authorizing Party trusts them as much as it trusts the Wallet instance. Signals are **factual**: the Wallet reports observable values, and the Authorizing Party alone decides what they mean.

### 1.2 Scope

This module defines the risk-signal framework, risk signal profiles, the collection trigger, transport in the holder binding proof, and verification. It does not define signal types; those are defined by [PaSO Risk Signal Registry] and by other published catalogues. It does not define any specific profile; PaSO publishes one, the [PaSO Default Risk Signal Profile]. It does not define the Authorizing Party's risk decisioning logic, hardware or platform attestation of signals, or per-transaction user consent. User consent for signal collection is governed by the credential's terms and conditions at issuance and is out of scope for PaSO.

### 1.3 Requirements Notation

The key words "**MUST**", "**MUST NOT**", "**REQUIRED**", "**SHALL**", "**SHALL NOT**", "**SHOULD**", "**SHOULD NOT**", "**RECOMMENDED**", "**MAY**", and "**OPTIONAL**" in this document are to be interpreted as described in [RFC2119] and [RFC8174] when, and only when, they are written in all capital letters.

## 2 Risk Signal Framework

### 2.1 Type Identifiers

Each risk signal type is identified by a URN following this structure:

```
urn:paso:risk:<domain>:<suffix>:<version>
```

Where:

- `<domain>` is an organisation identifier in reverse domain notation (e.g., `com.example`), or `global` for signal types defined by PaSO itself,
- `<suffix>` is one or more colon-separated segments identifying the signal (e.g., `geolocation`),
- `<version>` is a version number (e.g., `1`).

The Wallet identifies risk-signal types by the `urn:paso:risk:` prefix. The semantic structure of a signal type **SHALL** be immutable once published; changes **SHALL** require a new version of the type identifier.

### 2.2 Signal Envelope

Every risk signal is a JSON object with the following members:

| Member         | Required    | Description                                                                                                                            |
|----------------|-------------|--------------------------------------------------------------------------------------------------------------------------------------|
| `type`         | yes         | The signal type URN (Section 2.1).                                                                                                    |
| `collected_at` | yes         | An [ISO8601] UTC timestamp indicating when the Wallet measured the signal.                                                            |
| `status`       | yes         | One of `ok`, `unavailable`, or `denied` (Section 2.3).                                                                                |
| `value`        | conditional | The signal value. **REQUIRED** when `status` is `ok`; **MUST** be absent otherwise. Its structure is defined per signal type.        |

Overall binding of the signals to the transaction is provided by the holder binding proof signature (Section 5); `collected_at` exists so the Authorizing Party can additionally assess per-signal freshness (Section 4.3, Section 6).

### 2.3 Status

The `status` member reports whether the Wallet could measure the signal:

- `ok`: the signal was measured; `value` is present.
- `unavailable`: the signal could not be measured because the sensor is absent, no measurement was obtainable (e.g., no location fix), or the Wallet does not implement this signal type; `value` is absent.
- `denied`: the signal could not be measured because the required permission was refused; `value` is absent.

A required signal (Section 4.1) **SHALL NOT** be silently omitted: if it cannot be measured, the Wallet **SHALL** include its envelope with `status` set to `unavailable` or `denied`. This lets the Authorizing Party apply its own policy to missing measurements.

## 3 Risk Signal Profiles

### 3.1 Purpose

A **risk signal profile** bundles risk signal types into a single referencable set, each with a requirement flag and an optional freshness bound. Profiles exist so that an ecosystem can state its risk-signal expectations once, and have Attestation Providers and Transaction Data Type Rulebooks reference them, instead of restating an enumeration in every credential's metadata.

A profile is a governance document, not part of this specification. This section defines what a profile contains and how it is identified; any organisation **MAY** publish one. PaSO publishes exactly one, the [PaSO Default Risk Signal Profile].

No profile applies by default. A profile takes effect for a transaction data type only where it is referenced, as defined in Section 4.1.

### 3.2 Profile Identifiers

Each risk signal profile is identified by a URN following this structure:

```text
urn:paso:risk-profile:<domain>:<suffix>:<version>
```

Where:

- `<domain>` is an organisation identifier in reverse domain notation (e.g., `com.example`), or `global` for profiles published by PaSO itself,
- `<suffix>` is one or more colon-separated segments identifying the profile (e.g., `default`),
- `<version>` is a version number (e.g., `1`).

The `urn:paso:risk-profile:` prefix is distinct from the `urn:paso:risk:` prefix by which the Wallet identifies signal types (Section 2.1). A profile identifier **SHALL NOT** appear where a signal type URN is expected, and a signal type URN **SHALL NOT** appear where a profile identifier is expected.

The set of signals a profile declares, together with their `required` and `max_age` constraints, constitutes its **semantic structure**. The semantic structure **SHALL** be immutable once published; changes **SHALL** require a new version of the profile identifier.

### 3.3 Profile Contents

A risk signal profile **SHALL** define:

| Member        | Required            | Description                                                                                                    |
|---------------|---------------------|----------------------------------------------------------------------------------------------------------------|
| `profile`     | yes                 | The profile URN (Section 3.2).                                                                                 |
| `description` | no                  | A human-readable statement of the profile's purpose.                                                           |
| `encrypted`   | no, default `false` | When `true`, encryption per Section 7 is required for every transaction data type that references this profile. |
| `signals`     | yes                 | An array of profile entries per Section 3.4. **SHALL** contain at least one entry.                             |

A profile **SHALL** publish its contents in a form an implementer can transcribe without ambiguity; a table of `type`, `required`, and `max_age` is sufficient.

### 3.4 Profile Entries

Each entry in a profile's `signals` array declares one signal type and its constraints:

| Member     | Required | Description                                                                                                                                                                 |
|------------|----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `type`     | yes      | A signal type URN (Section 2.1). A profile **SHALL** reference only signal types whose definition is published, whether in [PaSO Risk Signal Registry] or another catalogue. |
| `required` | yes      | Boolean. When `true`, the Wallet **SHALL** include an envelope for this signal, reporting its `status` even where the value cannot be measured (Section 4.2).                 |
| `max_age`  | no       | Integer seconds. The maximum acceptable age of this signal's `collected_at`, applied by the Wallet per Section 4.3 and by the Authorizing Party per Section 6.                |

A profile **SHALL NOT** declare more than one entry for the same signal type.

## 4 Collection

### 4.1 Signal Set Resolution

The Wallet **SHALL** resolve the **effective signal set** for the matched transaction data type as follows:

1. **Collect referenced profiles.** Gather every risk signal profile referenced by either source:
   - the `risk_signal_profiles` member declared for the transaction data type in the signed credential metadata (per [PaSO Proof Metadata]), and
   - the profiles referenced for the transaction data type by its Transaction Data Type Rulebook (per [PaSO Core] Section 5).

2. **Union the profile entries.** The effective signal set is the union of the `signals` entries of every referenced profile. Where the same signal type appears in more than one referenced profile, `required` is the logical OR of its values and `max_age` is the minimum of the values present. The strictest constraint wins in every case.

3. **Apply enumerations as a ratchet.** Apply the `risk_signals` array declared in the signed credential metadata, and any signals enumerated directly by the Transaction Data Type Rulebook, over the unioned set. An enumeration entry **MAY** introduce a signal type absent from every referenced profile, promote `required` from `false` to `true`, or lower `max_age`. An enumeration entry **SHALL NOT** demote `required` from `true` to `false` and **SHALL NOT** raise `max_age`; where it specifies a looser value than a referenced profile established, the Wallet **SHALL** apply the stricter value.

A signal in the effective set whose resolved `required` is `true` is a **required signal**. One whose resolved `required` is `false` is an **optional signal**.

Where neither source references a profile and neither enumerates a signal, the effective signal set is empty.

### 4.2 Wallet Processing

When the effective signal set (Section 4.1) contains one or more required signals, the Wallet **SHALL** populate the `risk_signals` proof claim (Section 5) with an envelope for every required signal, each carrying its `status`. The Wallet **MAY** additionally include envelopes for optional signals when they are available. When the effective signal set contains no required signal, the Wallet **MAY** omit the `risk_signals` claim entirely.

A Wallet that does not implement a signal type resolved as required **SHALL** include that signal's envelope with `status` set to `unavailable` (Section 2.3). The Wallet **SHALL NOT** treat an unimplemented required signal as rendering the `transaction_data` entry incompatible; whether to accept such a transaction is the Authorizing Party's decision.

### 4.3 Freshness

Where the effective signal set resolves a `max_age` for a signal, the Wallet **SHALL** ensure that, at the moment it produces the holder binding proof signature, that signal's `collected_at` is no older than `max_age`. A measurement that has aged out **SHALL** either be re-taken or have its envelope carried with `status` `unavailable`.

The Authorizing Party applies the same bound against its own reference instant, as defined in Section 6. Two instants are named deliberately: the Wallet cannot know when the Authorizing Party will verify, and the Authorizing Party cannot re-measure.

## 5 Transport

The Wallet **SHALL** carry risk signals in the holder binding proof as an additional SCA response claim defined by [PaSO Core] Section 6.1:

- **`risk_signals`**: a JSON array of signal envelopes (Section 2.2). **REQUIRED** when the matched transaction data type has one or more required risk signals; otherwise absent.

Because the claim is part of the holder binding proof, it is covered by the same signature and dynamic-linking guarantee as the other SCA response claims; no separate hash or signature is defined.

When encryption is required for the matched transaction data type (Section 7), the value of the `risk_signals` claim is the encrypted structure defined in Section 7.5 instead of the plaintext array defined in this section and its profiles.

### 5.1 SD-JWT-VC Profile

For PaSO Credentials in [SD-JWT-VC] format, `risk_signals` **SHALL** be included as a top-level claim in the Key Binding JWT payload, alongside the other SCA response claims.

### 5.2 mdoc Profile

For PaSO Credentials in [mdoc] format, `risk_signals` **SHALL** be included as a device-signed data element under the namespace `urn:paso:sca:1`.

| Data element   | CBOR type      |
|----------------|----------------|
| `risk_signals` | array of maps  |

Each envelope is encoded as a CBOR map in which `type`, `collected_at`, and `status` are `tstr`.

The encoding of `value` follows its shape, as defined for that signal type by [PaSO Risk Signal Registry] or another catalogue:

| `value` shape    | CBOR encoding                                                                                                                          |
|------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| Object           | A CBOR map. String members are `tstr`; numeric members are CBOR floats; nested objects are CBOR maps, applying this table recursively.  |
| String           | `tstr`                                                                                                                                 |
| Array of strings | An array of `tstr`                                                                                                                     |
| Number           | A CBOR float                                                                                                                           |

## 6 Verification

The Authorizing Party **SHALL** perform the following checks in addition to those in [PaSO Proof Verify], after the SCA response claims verification. When the risk signals are encrypted (Section 7), these checks apply to the decrypted array and verification responsibilities are split as defined in Section 6.1.

1. **Presence of required signals.** Resolve the effective signal set for the matched transaction data type per Section 4.1. For every required signal, verify that an envelope with the matching `type` is present in the `risk_signals` array, with any `status`. If a required signal's envelope is missing, the Authorizing Party **SHALL** reject the transaction. The absence of a signal that did not resolve as required **SHALL NOT** be treated as a failure.

2. **Envelope well-formedness.** For each envelope, verify that `type` has the `urn:paso:risk:` prefix, `collected_at` is a valid [ISO8601] timestamp, `status` is one of `ok`, `unavailable`, or `denied`, and `value` is present if and only if `status` is `ok`. When `value` is present, verify it conforms to the schema for the signal type. If any envelope is malformed, the Authorizing Party **SHALL** reject the transaction.

3. **Freshness.** For each signal for which the effective signal set resolved a `max_age`, verify that `collected_at` is no older than `max_age`, measured from the time the Authorizing Party received the proof package, allowing for reasonable clock skew and forwarding delay. Where no `max_age` was resolved for a signal, the acceptable window is a matter of Transaction Data Type Rulebook or Authorizing Party policy and is not fixed by this module.

4. **Policy evaluation.** Interpreting signal values to reach a risk decision is the Authorizing Party's own policy and is out of scope for this module.

Envelopes for signal types the Authorizing Party does not recognise, and optional signals, **MAY** be ignored.

### 6.1 Encrypted Risk Signals

When encryption is required for the matched transaction data type (Section 7.2), verification is split between the Authorizing Party and the holder of the issuer decryption key.

The Authorizing Party, without access to the plaintext, **SHALL**:

1. verify the holder binding proof signature, which covers the encrypted `risk_signals` value and binds it to the transaction; and
2. verify that the `risk_signals` value is an encrypted structure (Section 7.5). If encryption was required but the value is plaintext, the Authorizing Party **SHALL** reject the transaction.

The holder of the issuer decryption key — the issuer, which in a first-party flow ([PaSO Core] Section 3) is the Authorizing Party — **SHALL**:

1. decrypt the `risk_signals` value using the private key referenced by the encrypted structure's key identifier; and
2. perform the checks of this section (presence of required signals, envelope well-formedness, freshness) on the decrypted array.

How the encrypted structure reaches the issuer in a third-party flow where the Authorizing Party is not the issuer, and the channel between them, are out of scope for this module.

## 7 Encryption of Risk Signals

### 7.1 Overview

For privacy, the risk-signals section **MAY** be required to be encrypted so that a Relying Party forwarding the proof package in a third-party flow ([PaSO Core] Section 3) cannot read the user's device and behavioral data. When encryption is required, the Wallet encrypts the entire `risk_signals` array to the issuer's public key. Only the holder of the corresponding private key — the issuer, which is or feeds the Authorizing Party — can decrypt and read the signals.

### 7.2 Encryption Trigger

Encryption is **required** for a transaction data type when **any** of the following mandates it:

1. the applicable Transaction Data Type Rulebook,
2. the issuer's credential metadata, via the `encrypted` flag on the `transaction_data_types` entry (per [PaSO Proof Metadata]), or
3. any risk signal profile referenced for the transaction data type, via its `encrypted` member (Section 3.3).

If any source requires encryption, the Wallet **SHALL** encrypt. Encryption applies to the entire `risk_signals` array for that transaction data type; individual signals are not encrypted separately.

### 7.3 Encryption Key

The Wallet **SHALL** obtain the issuer encryption key from the credential's signed credential metadata JWT, which is the authoritative source for a PaSO Credential's metadata (per [PaSO Proof Metadata] Section 3). For PaSO Credentials in [SD-JWT-VC] format, the Wallet **MAY** obtain the key from integrity-verified [SD-JWT-VC] Type Metadata as an equal-integrity alternative, mirroring the display relaxation in [PaSO Proof SD-JWT-VC and SVG] Section 2. A key that is not integrity-verified **SHALL** be treated as absent.

The issuer publishes one or more encryption keys under the `risk_signals_encryption_keys` metadata member, each with a key identifier and its intended key-management algorithm:

- For [SD-JWT-VC], as a JWK Set per [RFC7517], each JWK with `use` set to `enc`, a `kid`, and an `alg`.
- For [mdoc], as one or more `COSE_Key` structures per [RFC9052], each with a key identifier and algorithm.

When multiple keys are published, the Wallet **SHALL** select one and reference its key identifier in the encrypted structure's header.

If encryption is required and no integrity-verified issuer encryption key is available, the Wallet **SHALL NOT** send the risk signals in plaintext. The Wallet **SHALL** treat the `transaction_data` entry as incompatible, cease processing it, and inform the user.

### 7.4 Encryption Procedure

The Wallet **SHALL** encrypt before signing the holder binding proof ("encrypt-then-sign"):

1. Serialise the plaintext `risk_signals` array (Section 2.2).
2. Encrypt it to the selected issuer key, producing a single encrypted structure.
3. Place the encrypted structure as the value of the `risk_signals` claim.
4. Produce the holder binding proof signature (Key Binding JWT for [SD-JWT-VC], device authentication for [mdoc]) over the proof including the encrypted `risk_signals` value.

The holder binding proof signature therefore authenticates the ciphertext and binds it to the transaction; no separate hash of the risk signals is defined.

### 7.5 Formats

#### 7.5.1 SD-JWT-VC

The `risk_signals` claim value **SHALL** be a [JWE] in compact serialization (a string) instead of the JSON array of Section 5.1. The JWE protected header **SHALL** include `alg` (key management), `enc` (content encryption), and `kid` (the selected issuer key).

#### 7.5.2 mdoc

The `risk_signals` device-signed element **SHALL** be a `COSE_Encrypt` structure per [RFC9052] instead of the array of maps of Section 5.2. The COSE headers **SHALL** identify the key and the algorithms.

### 7.6 Algorithms

The Wallet and the decryptor **SHALL** support the following baseline:

- **[SD-JWT-VC] / JOSE**: `ECDH-ES` key agreement using the `P-256` curve with `A256GCM` content encryption, per [RFC7518].
- **[mdoc] / COSE**: the equivalent `ECDH-ES` key agreement with `A256GCM` content encryption, per [RFC9052].

Other algorithms **MAY** be used when the published issuer key declares them. The baseline guarantees a common denominator between the Wallet and the decryptor.

### 7.7 Consumer Detection

When encryption is required for the matched transaction data type, the consumer **SHALL** expect the `risk_signals` value to be an encrypted structure — a [JWE] compact string ([SD-JWT-VC]) or a `COSE_Encrypt` ([mdoc]) — rather than the plaintext structure of Section 5. A plaintext `risk_signals` value where encryption was required **SHALL** be rejected (Section 6.1).

### 7.8 Interaction with Authentication-Method Signals

Encryption covers the entire `risk_signals` array, including transaction-fact signals such as `urn:paso:risk:global:amr:1`. Under Section 6.1 the Authorizing Party can then verify only that the value is an encrypted structure; the checks on the signals themselves move to the holder of the issuer decryption key.

An ecosystem **SHOULD NOT** combine a profile that requires `urn:paso:risk:global:amr:1` with encryption for a transaction data type used in a third-party flow ([PaSO Core] Section 3). An Authorizing Party that is not the issuer would be unable to confirm how the user authenticated, which is precisely the check a Strong Customer Authentication policy depends on.

## 8 References

| Reference             | Description                                                                                                                |
|-----------------------|----------------------------------------------------------------------------------------------------------------------------|
| [PaSO Core]           | [PaSO Core](../paso-core.md)                                                                                               |
| [PaSO Proof Metadata] | [PaSO Proof: Metadata Module](paso-proof-metadata.md)                                                                      |
| [PaSO Proof Verify]   | [PaSO Proof: Verify Module](paso-proof-verify.md)                                                                          |
| [PaSO Proof SD-JWT-VC and SVG] | [PaSO Proof: SD-JWT-VC and SVG Module](paso-proof-sd-jwt-vc-svg.md)                                                        |
| [PaSO Risk Signal Registry] | [PaSO Proof: Risk Signal Registry](paso-proof-risk-signal-registry.md)                                             |
| [PaSO Default Risk Signal Profile] | [Default Risk Signal Profile](../../rulebooks/risk_profiles/Default.md)                                     |
| [RFC2119]             | [RFC 2119 — Key words for use in RFCs](https://www.rfc-editor.org/rfc/rfc2119.html)                                        |
| [RFC8174]             | [RFC 8174 — Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words](https://www.rfc-editor.org/rfc/rfc8174.html)        |
| [SD-JWT-VC]           | [SD-JWT-based Verifiable Credentials](https://datatracker.ietf.org/doc/draft-ietf-oauth-sd-jwt-vc/)                        |
| [mdoc]                | [ISO/IEC 18013-5:2021 — Mobile driving licence application](https://www.iso.org/standard/69084.html)                       |
| [JWE]                 | [RFC 7516 — JSON Web Encryption (JWE)](https://www.rfc-editor.org/rfc/rfc7516.html)                                        |
| [RFC7517]             | [RFC 7517 — JSON Web Key (JWK)](https://www.rfc-editor.org/rfc/rfc7517.html)                                               |
| [RFC7518]             | [RFC 7518 — JSON Web Algorithms (JWA)](https://www.rfc-editor.org/rfc/rfc7518.html)                                        |
| [RFC9052]             | [RFC 9052 — CBOR Object Signing and Encryption (COSE)](https://www.rfc-editor.org/rfc/rfc9052.html)                        |
| [ISO8601]             | [ISO 8601 — Date and time format](https://www.iso.org/iso-8601-date-and-time-format.html)                                  |

## Annex A: Examples

_**Note**: This annex is **informative**._

### A.1 Risk Signals Array

A `risk_signals` array for a transaction whose effective signal set required `response_mode`, geolocation, and call activity, and listed device motion as optional:

```json
[
  {
    "type": "urn:paso:risk:global:response_mode:1",
    "collected_at": "2026-07-24T10:15:30Z",
    "status": "ok",
    "value": "direct_post.jwt"
  },
  {
    "type": "urn:paso:risk:global:geolocation:1",
    "collected_at": "2026-07-24T10:15:30Z",
    "status": "ok",
    "value": {
      "lat": 52.5200,
      "lon": 13.4050,
      "accuracy": 12.5,
      "altitude": 34.0,
      "source": "gnss"
    }
  },
  {
    "type": "urn:paso:risk:global:call_activity:1",
    "collected_at": "2026-07-24T10:15:30Z",
    "status": "ok",
    "value": {
      "call_state": "active",
      "direction": "incoming",
      "call_active_since": "2026-07-24T10:12:04Z"
    }
  },
  {
    "type": "urn:paso:risk:global:device_motion:1",
    "collected_at": "2026-07-24T10:15:30Z",
    "status": "ok",
    "value": {
      "window_ms": 1000,
      "orientation": { "pitch": 5.2, "roll": -1.8, "yaw": 120.0 },
      "acceleration": { "rms": 0.12, "max": 0.45 },
      "rotation_rate": { "rms": 0.03, "max": 0.11 }
    }
  }
]
```

### A.2 KB-JWT Payload (SD-JWT-VC)

The `risk_signals` claim as a top-level KB-JWT claim, shown alongside selected SCA response claims:

```json
{
  "nonce": "bUtJdjJESWdmTWNjb011YQ",
  "sd_hash": "Re-CtLZfjGLErKy3eSriZ4bBx3AtUH5Q5wsWiiWKIwY",
  "jti": "deeec2b0-3bea-4477-bd5d-e3462a709481",
  "display_locale": "de",
  "transaction_data_hash": "OJcnQQByvV1iTYxiQQQx4dact-TNnSG-Ku_cs_6g55Q",
  "transaction_data_hash_alg": "sha-256",
  "risk_signals": [
    {
      "type": "urn:paso:risk:global:amr:1",
      "collected_at": "2026-07-24T10:15:30Z",
      "status": "ok",
      "value": ["pin", "hwk", "bio_strong", "face"]
    },
    {
      "type": "urn:paso:risk:global:geolocation:1",
      "collected_at": "2026-07-24T10:15:30Z",
      "status": "ok",
      "value": { "lat": 52.5200, "lon": 13.4050, "accuracy": 12.5 }
    }
  ]
}
```

### A.3 mdoc DeviceSigned Namespace

CBOR diagnostic notation for the `risk_signals` element under `urn:paso:sca:1`:

```cbor-diag
"urn:paso:sca:1" : {
  "risk_signals" : [
    {
      "type" : "urn:paso:risk:global:geolocation:1",
      "collected_at" : "2026-07-24T10:15:30Z",
      "status" : "ok",
      "value" : { "lat" : 52.5200, "lon" : 13.4050, "accuracy" : 12.5 }
    }
  ]
}
```

### A.4 Metadata Declaration

A `transaction_data_types` entry that references the default profile and tightens it: a shorter freshness bound is imposed on geolocation, and a signal absent from the profile is added (per [PaSO Proof Metadata]).

```json
{
  "urn:paso:sca:global:payment:1": {
    "risk_signal_profiles": ["urn:paso:risk-profile:global:default:1"],
    "risk_signals": [
      { "type": "urn:paso:risk:global:geolocation:1", "max_age": 60 },
      { "type": "urn:paso:risk:global:amr:1", "required": true }
    ]
  }
}
```

The default profile declares geolocation with no `max_age`, so the first enumeration entry lowers it to 60 seconds. The second adds `amr`, which the default profile deliberately omits. An entry attempting the reverse of either — raising `max_age`, or setting `required` to `false` against a profile's `true` — would have no effect, per Section 4.1 step 3.

### A.5 Encrypted `risk_signals` Claim (SD-JWT-VC)

When encryption is required, the KB-JWT `risk_signals` claim value is a JWE compact string instead of the array shown in A.2:

```json
{
  "nonce": "bUtJdjJESWdmTWNjb011YQ",
  "sd_hash": "Re-CtLZfjGLErKy3eSriZ4bBx3AtUH5Q5wsWiiWKIwY",
  "jti": "deeec2b0-3bea-4477-bd5d-e3462a709481",
  "display_locale": "de",
  "transaction_data_hash": "OJcnQQByvV1iTYxiQQQx4dact-TNnSG-Ku_cs_6g55Q",
  "transaction_data_hash_alg": "sha-256",
  "risk_signals": "eyJhbGciOiJFQ0RILUVTIiwiZW5jIjoiQTI1NkdDTSIsImtpZCI6Imlzc3Vlci1lbmMtMSJ9..O94i8v...ciphertext...Q.tag"
}
```

The JWE protected header (decoded) is:

```json
{ "alg": "ECDH-ES", "enc": "A256GCM", "kid": "issuer-enc-1" }
```

Any `amr` signal in the effective set is inside this ciphertext. Where the Authorizing Party is not the issuer it cannot read it — see Section 7.8.

### A.6 Issuer Encryption Key and Trigger (Metadata)

A `transaction_data_types` entry requiring encryption, with the issuer encryption key published as a JWK Set in the signed credential metadata (per [PaSO Proof Metadata]):

```json
{
  "transaction_data_types": {
    "urn:paso:sca:global:payment:1": {
      "risk_signals": [
        { "type": "urn:paso:risk:global:geolocation:1", "required": true }
      ],
      "encrypted": true
    }
  },
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
```

### A.7 Profile Reference and Resolution

The default profile published by PaSO ([PaSO Default Risk Signal Profile]) declares:

| `type`                                 | `required` | `max_age` |
|----------------------------------------|------------|-----------|
| `urn:paso:risk:global:response_mode:1` | `true`     | —         |
| `urn:paso:risk:global:geolocation:1`   | `true`     | —         |
| `urn:paso:risk:global:call_activity:1` | `true`     | —         |
| `urn:paso:risk:global:device_motion:1` | `true`     | —         |

An ecosystem profile `urn:paso:risk-profile:com.example:high-value:1` declares:

| `type`                               | `required` | `max_age` |
|--------------------------------------|------------|-----------|
| `urn:paso:risk:global:geolocation:1` | `true`     | `120`     |
| `urn:paso:risk:global:amr:1`         | `true`     | —         |

A transaction data type referencing both profiles, with the metadata enumeration of A.4 also applied, resolves to:

| `type`                                 | `required` | `max_age` | Source                                              |
|----------------------------------------|------------|-----------|-----------------------------------------------------|
| `urn:paso:risk:global:response_mode:1` | `true`     | —         | default profile                                     |
| `urn:paso:risk:global:geolocation:1`   | `true`     | `60`      | both profiles; `max_age` lowered by the enumeration |
| `urn:paso:risk:global:call_activity:1` | `true`     | —         | default profile                                     |
| `urn:paso:risk:global:device_motion:1` | `true`     | —         | default profile                                     |
| `urn:paso:risk:global:amr:1`           | `true`     | —         | ecosystem profile, and the enumeration              |

Because `amr` resolved as required and neither profile sets `encrypted`, the Authorizing Party can verify the authentication methods directly. Had either profile set `encrypted` to `true`, that check would move behind decryption per Section 6.1, which Section 7.8 advises against in a third-party flow.
