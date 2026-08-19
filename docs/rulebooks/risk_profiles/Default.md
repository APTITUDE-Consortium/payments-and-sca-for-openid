---
title: "Default Risk Signal Profile (urn:paso:risk-profile:global:default:1)"
description: The recommended starting bundle of PaSO risk signals — every signal type in the global registry except authentication methods.
---

# Risk Signal Profile: Default

**Profile identifier**: `urn:paso:risk-profile:global:default:1`

The recommended starting bundle of risk signals for a PaSO transaction data type. It gathers every signal type defined in [PaSO Risk Signal Registry] except `urn:paso:risk:global:amr:1`, which is left to ecosystems that require Strong Customer Authentication to mandate for themselves.

This profile is a governance document published by PaSO, structured per [PaSO Risk Signals] Section 3. It applies to a transaction data type only where it is referenced, either from signed credential metadata (per [PaSO Proof Metadata]) or from a Transaction Data Type Rulebook. **Nothing applies this profile implicitly.** "Default" here means *recommended starting point*, not *applies unless suppressed*.

## 1 Profile

| Member        | Value                                                              |
|---------------|--------------------------------------------------------------------|
| `profile`     | `urn:paso:risk-profile:global:default:1`                            |
| `description` | Recommended starting bundle of PaSO risk signals, excluding `amr`. |
| `encrypted`   | not set (defaults to `false`)                                      |
| `signals`     | The four entries of Section 2.                                     |

## 2 Signals

| `type`                                 | `required` | `max_age` |
|----------------------------------------|------------|-----------|
| `urn:paso:risk:global:response_mode:1` | `true`     | —         |
| `urn:paso:risk:global:geolocation:1`   | `true`     | —         |
| `urn:paso:risk:global:call_activity:1` | `true`     | —         |
| `urn:paso:risk:global:device_motion:1` | `true`     | —         |

Every entry is `required`. A Wallet processing a transaction data type that references this profile **SHALL** include an envelope for all four signals, reporting `status` `unavailable` or `denied` where a value cannot be obtained, per [PaSO Risk Signals] Section 4.2. Silent omission is not permitted.

No `max_age` is set. Freshness is therefore a matter of Transaction Data Type Rulebook or Authorizing Party policy, per [PaSO Risk Signals] Section 6. An Attestation Provider or Rulebook that needs a bound **MAY** impose one by enumeration, which tightens this profile per [PaSO Risk Signals] Section 4.1.

## 3 Adopting This Profile

An Attestation Provider adopts this profile by referencing it for a transaction data type in the signed credential metadata:

```json
{
  "urn:paso:sca:global:payment:1": {
    "risk_signal_profiles": ["urn:paso:risk-profile:global:default:1"]
  }
}
```

Adopters **SHOULD** weigh two consequences before referencing it:

- **Three of the four signals require device permissions.** Geolocation, call activity, and device motion are measured signals; a user who refuses permission yields `status` `denied` rather than a value. This profile obliges the Wallet to report the refusal, not to obtain the measurement.
- **This profile does not mandate encryption.** `encrypted` is unset, so the signals travel in plaintext within the holder binding proof unless encryption is required by the `encrypted` metadata flag or by the applicable Transaction Data Type Rulebook, per [PaSO Risk Signals] Section 7.2. In a third-party flow a Relying Party forwarding the proof package can read them. An ecosystem carrying location data through untrusted intermediaries **SHOULD** require encryption.

## 4 References

| Reference                   | Description                                                                              |
|-----------------------------|------------------------------------------------------------------------------------------|
| [PaSO Risk Signals]         | [PaSO Proof: Risk Signals Module](../../specs/proof/paso-proof-risk-signals.md)           |
| [PaSO Risk Signal Registry] | [PaSO Proof: Risk Signal Registry](../../specs/proof/paso-proof-risk-signal-registry.md)  |
| [PaSO Proof Metadata]       | [PaSO Proof: Metadata Module](../../specs/proof/paso-proof-metadata.md)                   |
