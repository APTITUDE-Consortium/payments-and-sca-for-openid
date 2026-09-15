# Risk Signal Profile: Default

**Profile identifier**: `urn:paso:risk-profile:global:default:1`

The recommended starting bundle of risk signals for a PaSO transaction data type. It gathers every signal type defined in [PaSO Risk Signal Registry] except `urn:paso:risk:global:amr:1`, which is left to ecosystems that require Strong Customer Authentication to mandate for themselves.

This profile is a governance document published by PaSO, structured per [PaSO Risk Signals] Section 3. It applies to a transaction data type only where it is referenced, either from signed credential metadata (per [PaSO Proof Metadata]) or from a Transaction Data Type Rulebook. **Nothing applies this profile implicitly.** "Default" here means *recommended starting point*, not *applies unless suppressed*.

## 1 Profile

| Member        | Value                                                              |
|---------------|--------------------------------------------------------------------|
| `profile`     | `urn:paso:risk-profile:global:default:1`                           |
| `description` | Recommended starting bundle of PaSO risk signals, excluding `amr`. |
| `encrypted`   | `true`                                                             |
| `signals`     | The seven entries of Section 2.                                    |

## 2 Signals

| `type`                                  | `required` | `max_age` |
|-----------------------------------------|------------|-----------|
| `urn:paso:risk:global:response_mode:1`  | `true`     | `600`     |
| `urn:paso:risk:global:geolocation:1`    | `true`     | `600`     |
| `urn:paso:risk:global:call_activity:1`  | `true`     | `600`     |
| `urn:paso:risk:global:device_motion:1`  | `true`     | `600`     |
| `urn:paso:risk:global:screen_capture:1` | `true`     | `600`     |
| `urn:paso:risk:global:device_basics:1`  | `true`     | `600`     |
| `urn:paso:risk:global:app_vendor_id:1`  | `true`     | `600`     |

Every entry is `required`. A Wallet processing a transaction data type that references this profile **SHALL** include an envelope for all seven signals, reporting `status` `unavailable` or `denied` where a value cannot be obtained, per [PaSO Risk Signals] Section 4.2. Silent omission is not permitted.

Every entry carries a `max_age` of `600` seconds (10 minutes). At the moment the Wallet produces the holder binding proof signature, each signal's `collected_at` must be no older than 10 minutes; a measurement that has aged out is re-taken or carried with `status` `unavailable`, per [PaSO Risk Signals] Section 4.3. An Attestation Provider or Rulebook that needs a tighter bound **MAY** lower it by enumeration, per [PaSO Risk Signals] Section 4.1; an enumeration cannot raise it.

## 3 Adopting This Profile

An Attestation Provider adopts this profile by referencing it for a transaction data type in the signed credential metadata:

```json
{
  "urn:paso:sca:global:payment:1": {
    "risk_signal_profiles": ["urn:paso:risk-profile:global:default:1"]
  }
}
```

Adopters **SHOULD** weigh three consequences before referencing it:

- **Three of the seven signals require device permissions.** Geolocation, call activity, and device motion are measured signals; a user who refuses permission yields `status` `denied` rather than a value. Response mode, device basics, app vendor ID, and screen capture involve no permission prompt. This profile obliges the Wallet to report the refusal, not to obtain the measurement. Screen capture is additionally OS-version-dependent: on platforms that expose no capture observation the Wallet reports `status` `unavailable`, per [PaSO Risk Signal Registry] Section 2.4.
- **This profile mandates encryption.** `encrypted` is `true`, so every transaction data type that references this profile requires encryption of the risk signals per [PaSO Risk Signals] Section 7. In a third-party flow a Relying Party forwarding the proof package therefore cannot read the geolocation or use the stable app vendor identifier for tracking. The cost falls on verification: an Authorizing Party that does not hold the issuer decryption key can confirm only that the `risk_signals` value is an encrypted structure, per [PaSO Risk Signals] Section 6.1; the checks on the signals themselves move to the holder of the decryption key. Because this profile excludes `urn:paso:risk:global:amr:1`, the caution in [PaSO Risk Signals] Section 7.8 against encrypting authentication-method signals in third-party flows does not arise.
- **The 10-minute freshness bound binds the Authorizing Party too.** The Authorizing Party applies the same `max_age` against its own reference instant, per [PaSO Risk Signals] Section 6. An adopter whose proofs are verified long after issuance — deferred or batch verification — will find every signal aged out at that instant; this profile assumes verification reasonably promptly after the proof is produced.

## 4 References

| Reference                   | Description                                                                                       |
|-----------------------------|---------------------------------------------------------------------------------------------------|
| [PaSO Risk Signals]         | [PaSO Proof: Risk Signals Module](../../specifications/proof/paso-proof-risk-signals.md)          |
| [PaSO Risk Signal Registry] | [PaSO Proof: Risk Signal Registry](../../specifications/proof/paso-proof-risk-signal-registry.md) |
| [PaSO Proof Metadata]       | [PaSO Proof: Metadata Module](../../specifications/proof/paso-proof-metadata.md)                  |
