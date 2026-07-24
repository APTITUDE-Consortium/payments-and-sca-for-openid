# PaSO Risk Signals Module — Design

**Date:** 2026-07-24
**Status:** Approved design, ready for spec authoring
**Deliverable:** A new PaSO Proof sub-module specification at `docs/specs/proof/paso-proof-risk-signals.md`

## Purpose

Define how a Wallet carries **risk signals** — device/environment/behavioral
observations useful for fraud detection — from the Wallet to the Authorizing
Party as part of a PaSO transaction. The starter set targets
anti-social-engineering / remote-access-fraud detection: where the device is,
whether the user is on a call, and whether the device is being physically
handled.

## Key decisions

| Decision | Choice | Rationale |
|---|---|---|
| Direction | Wallet → Authorizing Party evidence | Signals are collected by the Wallet and consumed by the Authorizing Party's risk engine. |
| Trust model | Wallet self-asserted | Signals ride the existing holder binding proof signature; no independent/hardware attestation. The Authorizing Party trusts them as much as it trusts the Wallet instance. |
| Signal semantics | Raw / factual | The Wallet reports observable facts; interpretation and decisioning are the Authorizing Party's. |
| Extensibility | Extensible framework + starter set | Module defines an envelope + `urn:paso:risk:` naming scheme, then normatively specifies three signals. |
| Collection trigger | Union of (a) Transaction Data Type Rulebook and (b) issuer credential metadata `risk_signals` flag | Governed by the credential/transaction-data-type definition, not the RP request. |
| Consent | Out of scope | Handled at issuance via credential T&C. No per-transaction consent screen. |
| Transport | New `risk_signals` claim in the SCA response claims ([PaSO Core] §6.1) | Rides the KB-JWT / mdoc DeviceSigned signature; mirrors the existing SCA-claim pattern. |
| Decisioning | Out of scope | PaSO defines structure + carriage + integrity + presence, never the decision. |

## Module identity

- **File:** `docs/specs/proof/paso-proof-risk-signals.md`
- **Title:** "PaSO Proof: Risk Signals Module"
- **Classification:** Proof sub-module (extends the holder binding proof, the
  Metadata module, and the Verify module).

## Framework: signal envelope

Every risk signal is a JSON object sharing a common envelope:

```json
{
  "type": "urn:paso:risk:global:geolocation:1",
  "collected_at": "2026-07-24T10:15:30Z",
  "status": "ok",
  "value": { }
}
```

- **`type`** (REQUIRED): signal type URN. Wallet identifies risk-signal types by
  the `urn:paso:risk:` prefix. URN structure mirrors the transaction-data-type
  scheme: `urn:paso:risk:<domain>:<suffix>:<version>`, where `<domain>` is
  reverse-DNS or `global` for PaSO-defined signals.
- **`collected_at`** (REQUIRED): [ISO8601] UTC timestamp of measurement. Enables
  freshness assessment. Overall binding to the transaction is provided by the
  holder binding proof signature.
- **`status`** (REQUIRED): `ok` | `unavailable` | `denied`.
  - `ok` → `value` present.
  - `unavailable` → sensor absent / no fix; `value` omitted.
  - `denied` → permission refused; `value` omitted.
- **`value`** (conditional): present iff `status = ok`; shape defined per signal type.

The `risk_signals` proof claim is a JSON array of these envelopes.

A `required` signal is never silently dropped — if it cannot be collected it is
reported with `status: "unavailable"` or `"denied"`, pushing the policy decision
to the Authorizing Party.

## Starter signal schemas

All `value` shapes below apply when `status = ok`.

### Geolocation — `urn:paso:risk:global:geolocation:1`

```json
"value": {
  "lat": 52.5200,
  "lon": 13.4050,
  "accuracy": 12.5,
  "altitude": 34.0,
  "source": "gnss"
}
```

- `lat` / `lon` (REQUIRED): WGS84 decimal degrees.
- `accuracy` (REQUIRED): horizontal radius in metres.
- `altitude` (OPTIONAL): metres.
- `source` (OPTIONAL): `gnss` | `network` | `fused`.

### Call activity — `urn:paso:risk:global:call_activity:1`

```json
"value": {
  "call_state": "active",
  "direction": "incoming",
  "call_active_since": "2026-07-24T10:12:04Z"
}
```

- `call_state` (REQUIRED): `idle` | `ringing` | `active`.
- `direction` (OPTIONAL): `incoming` | `outgoing` | `unknown`.
- `call_active_since` (OPTIONAL): ISO8601 — lets the Authorizing Party see the
  call predates the payment flow (the key social-engineering tell).

### Device orientation & motion — `urn:paso:risk:global:device_motion:1`

Motion is time-series; to stay raw/factual yet compact, the schema carries
current orientation plus a bounded statistical summary over a short sampling
window (no interpretation such as "walking").

```json
"value": {
  "window_ms": 1000,
  "orientation": { "pitch": 5.2, "roll": -1.8, "yaw": 120.0 },
  "acceleration": { "rms": 0.12, "max": 0.45 },
  "rotation_rate": { "rms": 0.03, "max": 0.11 }
}
```

- `window_ms` (REQUIRED): sampling window length in milliseconds.
- `orientation` (REQUIRED): device attitude in degrees (`pitch`, `roll`, `yaw`).
- `acceleration` (REQUIRED): user-acceleration magnitude in *g* — `rms` and `max`
  over the window.
- `rotation_rate` (REQUIRED): gyroscope magnitude in rad/s — `rms` and `max` over
  the window.

## Collection trigger

A signal is collected when **either** source flags it (union semantics).

### (a) Issuer credential metadata

Extend the `transaction_data_types` structure in [PaSO Proof Metadata] with an
optional `risk_signals` array per transaction-data-type entry:

```json
"transaction_data_types": [
  {
    "type": "urn:paso:sca:global:payment:1",
    "risk_signals": [
      { "type": "urn:paso:risk:global:geolocation:1", "required": true },
      { "type": "urn:paso:risk:global:call_activity:1", "required": true },
      { "type": "urn:paso:risk:global:device_motion:1", "required": false }
    ]
  }
]
```

- `required: true` → signal MUST appear in the proof (as `ok`, `unavailable`, or
  `denied`).
- `required: false` → Wallet includes it when available, MAY omit otherwise.

### (b) Transaction Data Type Rulebook

The governance doc for a transaction data type MAY mandate risk signals for that
type. These combine by union with the metadata list; if a signal is `required` in
either source, it is required.

### Wallet processing rule

When a matched `transaction_data` entry's type has any required risk signals
(from either source), the Wallet MUST populate the `risk_signals` proof claim
covering every required signal, each with its `status`.

## Transport in the holder binding proof

Add one claim to the SCA response claims ([PaSO Core] §6.1):

| Claim | Required | Description |
|---|---|---|
| `risk_signals` | conditional | JSON array of risk-signal envelopes. REQUIRED when the matched transaction data type has one or more required risk signals; otherwise absent. |

- **SD-JWT-VC profile:** `risk_signals` is a top-level claim in the KB-JWT payload,
  alongside the existing SCA response claims.
- **mdoc profile:** `risk_signals` is a DeviceSigned data element under the
  existing `urn:paso:sca:1` namespace. CBOR type: array of maps; `collected_at`
  as tstr, numeric sensor values as CBOR floats.

Because it rides the KB-JWT / DeviceAuthentication signature, the signals are
covered by the same dynamic-linking guarantee as the rest of the proof — no
separate hash or signature.

## Verification (Authorizing Party)

Extend the [PaSO Proof Verify] procedure with a risk-signals step, after the
existing SCA response claims verification:

1. **Presence of required signals.** Determine the required signal set (union of
   issuer metadata and Transaction Data Type Rulebook). Verify every `required`
   signal is present (with any `status`). If a required signal is missing
   entirely, reject.
2. **Envelope well-formedness.** For each entry: `type` has the `urn:paso:risk:`
   prefix, `collected_at` is a valid timestamp, `status` is in the enum, and
   `value` is present iff `status = ok` and conforms to the signal type's schema.
3. **Freshness.** Verify each `collected_at` is within an acceptable window
   relative to the request/response time. Acceptable skew is policy — defined by
   the rulebook or Authorizing Party, not hard-coded.
4. **Policy evaluation.** Interpreting signal *values* is the Authorizing Party's
   own risk policy and is **out of scope**. The module guarantees only that the
   signals are present, well-formed, fresh, and bound to the transaction.

Unknown/optional signals present in the array are passed through and MAY be
ignored.

## Cross-module impact (all additive)

- **[PaSO Core] §6.1** — add the `risk_signals` SCA response claim (+ SD-JWT-VC and
  mdoc profile rows).
- **[PaSO Proof Metadata]** — extend `transaction_data_types` entries with the
  optional `risk_signals` array.
- **[PaSO Proof Verify]** — add the risk-signals verification step.
- **New file** — `docs/specs/proof/paso-proof-risk-signals.md`.

## Out of scope

- Per-transaction user consent (handled at issuance via T&C).
- Hardware/platform attestation of signals.
- The Authorizing Party's risk decisioning logic.
- Any signal beyond the three starter types (the framework allows extension).

## Document structure (planned)

Following existing PaSO module conventions:

1. Frontmatter (`title`, `description`)
2. Abstract
3. Introduction (Overview, Scope, Requirements Notation)
4. Risk Signal Framework (URN scheme, envelope, status semantics)
5. Starter Signal Types (the three schemas)
6. Collection (metadata extension + rulebook, union rule, Wallet processing)
7. Transport (Core §6.1 claim, SD-JWT-VC profile, mdoc profile)
8. Verification (Authorizing Party steps)
9. References table
10. Annex (informative): example `risk_signals` array, example KB-JWT payload,
    example mdoc namespace, example metadata declaration.