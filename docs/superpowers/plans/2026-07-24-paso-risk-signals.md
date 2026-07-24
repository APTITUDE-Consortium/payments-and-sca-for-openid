# PaSO Risk Signals Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new PaSO Proof sub-module specifying how a Wallet carries self-asserted risk signals (geolocation, call activity, device motion) to the Authorizing Party, plus the additive edits to Core, Metadata, and Verify that wire it in.

**Architecture:** A new normative markdown spec at `docs/specs/proof/paso-proof-risk-signals.md` defines an extensible `urn:paso:risk:` framework, a common signal envelope, three starter signal types, a metadata/rulebook collection trigger, transport via a new `risk_signals` holder-binding-proof claim, and Authorizing-Party verification. Three existing specs get small additive edits, and the Jekyll site index gets a new module link.

**Tech Stack:** Markdown (kramdown/GFM), Jekyll static site (`docs/`), no code/runtime.

## Global Constraints

- All specs use YAML frontmatter with `title` and `description`.
- Normative keywords (MUST, SHALL, SHOULD, MAY, etc.) are **bold** and interpreted per [RFC2119]/[RFC8174]; every module includes the standard "Requirements Notation" subsection verbatim.
- Section numbering is manual (`## 1`, `### 1.1`, …); References is the last numbered section; informative Annexes follow.
- URN scheme mirrors transaction-data-types: `urn:paso:risk:<domain>:<suffix>:<version>`; `<domain>` is reverse-DNS or `global` for PaSO-defined signals.
- Signals are Wallet **self-asserted** and **raw/factual**; PaSO never mandates a risk decision — that is the Authorizing Party's.
- Consent is out of scope (handled at issuance via credential T&C).
- Proof sub-modules link to siblings with relative paths (`../paso-core.md`, `paso-proof-metadata.md`); reference labels use the `[PaSO X]` bracket style.
- Verification build command: `cd docs && bundle exec jekyll build`.

---

### Task 1: New spec file — PaSO Proof: Risk Signals Module

**Files:**
- Create: `docs/specs/proof/paso-proof-risk-signals.md`

**Interfaces:**
- Produces: the signal envelope shape (`type`, `collected_at`, `status`, `value`), the three signal type URNs and their `value` schemas, the `risk_signals` proof-claim name, and the `risk_signals` metadata-declaration shape — all consumed by Tasks 2–4.

- [ ] **Step 1: Write the full spec file**

Create `docs/specs/proof/paso-proof-risk-signals.md` with exactly this content:

````markdown
---
title: "PaSO Proof: Risk Signals Module"
description: Wallet-asserted risk signals carried in the holder binding proof for the Authorizing Party.
---

# PaSO Proof: Risk Signals Module

## Abstract

This document defines an extensible framework for **risk signals** in PaSO: device, environment, and behavioral observations that a Wallet collects and carries to the Authorizing Party as part of a transaction. It specifies a signal envelope, a naming scheme, a normative starter set of three signal types, how collection is triggered, how signals are transported in the holder binding proof, and how the Authorizing Party verifies them. Risk signals are Wallet self-asserted and factual; PaSO standardises their structure and carriage but never mandates a risk decision.

## 1 Introduction

### 1.1 Overview

Fraud detection benefits from device and behavioral context — where a device is, whether the user is on a call, whether the device is being physically handled. [PaSO Core] defines the holder binding proof but carries no such signals. This module adds an extensible risk-signal framework whose signals ride the existing holder binding proof signature, so no additional signing infrastructure is required.

Risk signals are **self-asserted** by the Wallet: they inherit the Wallet's key-binding signature and carry no independent attestation. The Authorizing Party trusts them as much as it trusts the Wallet instance. Signals are **factual**: the Wallet reports observable values, and the Authorizing Party alone decides what they mean.

### 1.2 Scope

This module defines the risk-signal framework, a starter set of signal types, the collection trigger, transport in the holder binding proof, and verification. It does not define the Authorizing Party's risk decisioning logic, hardware or platform attestation of signals, or per-transaction user consent. User consent for signal collection is governed by the credential's terms and conditions at issuance and is out of scope for PaSO.

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

Overall binding of the signals to the transaction is provided by the holder binding proof signature (Section 4); `collected_at` exists so the Authorizing Party can additionally assess per-signal freshness.

### 2.3 Status

The `status` member reports whether the Wallet could measure the signal:

- `ok`: the signal was measured; `value` is present.
- `unavailable`: the signal could not be measured because the sensor is absent or no measurement was obtainable (e.g., no location fix); `value` is absent.
- `denied`: the signal could not be measured because the required permission was refused; `value` is absent.

A required signal (Section 3) **SHALL NOT** be silently omitted: if it cannot be measured, the Wallet **SHALL** include its envelope with `status` set to `unavailable` or `denied`. This lets the Authorizing Party apply its own policy to missing measurements.

## 3 Starter Signal Types

This section defines the signal types in the `global` domain. Each `value` schema applies when `status` is `ok`.

### 3.1 Geolocation

Type: `urn:paso:risk:global:geolocation:1`

| Member     | Required | Description                                        |
|------------|----------|----------------------------------------------------|
| `lat`      | yes      | WGS84 latitude in decimal degrees.                 |
| `lon`      | yes      | WGS84 longitude in decimal degrees.                |
| `accuracy` | yes      | Horizontal accuracy radius in metres.              |
| `altitude` | no       | Altitude in metres.                                |
| `source`   | no       | One of `gnss`, `network`, or `fused`.              |

### 3.2 Call Activity

Type: `urn:paso:risk:global:call_activity:1`

| Member              | Required | Description                                                            |
|---------------------|----------|-----------------------------------------------------------------------|
| `call_state`        | yes      | One of `idle`, `ringing`, or `active`.                                 |
| `direction`         | no       | One of `incoming`, `outgoing`, or `unknown`.                           |
| `call_active_since` | no       | An [ISO8601] timestamp indicating when the current call became active. |

### 3.3 Device Orientation & Motion

Type: `urn:paso:risk:global:device_motion:1`

The value reports current device orientation and a bounded statistical summary of motion over a short sampling window. No interpretation (such as "walking") is performed by the Wallet.

| Member          | Required | Description                                                                                              |
|-----------------|----------|--------------------------------------------------------------------------------------------------------|
| `window_ms`     | yes      | Length of the sampling window in milliseconds.                                                          |
| `orientation`   | yes      | Object with `pitch`, `roll`, and `yaw`, each the device attitude angle in degrees.                      |
| `acceleration`  | yes      | Object with `rms` and `max`, each the user-acceleration magnitude in *g* over the window.               |
| `rotation_rate` | yes      | Object with `rms` and `max`, each the gyroscope rotation-rate magnitude in radians per second over the window. |

## 4 Collection

### 4.1 Collection Trigger

The risk signals a Wallet **SHALL** collect for a transaction are determined by the union of two sources for the matched transaction data type:

1. **Issuer credential metadata**: the `risk_signals` array declared for the transaction data type in the signed credential metadata (per [PaSO Proof Metadata]).
2. **Transaction Data Type Rulebook**: the risk signals mandated for the transaction data type by its rulebook (per [PaSO Core] Section 5).

A signal is **required** if it is marked required in either source. A signal that is present in either source but not required is **optional**.

### 4.2 Wallet Processing

When the matched `transaction_data` entry's type has one or more required risk signals (Section 4.1), the Wallet **SHALL** populate the `risk_signals` proof claim (Section 5) with an envelope for every required signal, each carrying its `status`. The Wallet **MAY** additionally include envelopes for optional signals when they are available. When no risk signal is required for the matched transaction data type, the Wallet **MAY** omit the `risk_signals` claim entirely.

## 5 Transport

The Wallet **SHALL** carry risk signals in the holder binding proof as an additional SCA response claim defined by [PaSO Core] Section 6.1:

- **`risk_signals`**: a JSON array of signal envelopes (Section 2.2). **REQUIRED** when the matched transaction data type has one or more required risk signals; otherwise absent.

Because the claim is part of the holder binding proof, it is covered by the same signature and dynamic-linking guarantee as the other SCA response claims; no separate hash or signature is defined.

### 5.1 SD-JWT-VC Profile

For PaSO Credentials in [SD-JWT-VC] format, `risk_signals` **SHALL** be included as a top-level claim in the Key Binding JWT payload, alongside the other SCA response claims.

### 5.2 mdoc Profile

For PaSO Credentials in [mdoc] format, `risk_signals` **SHALL** be included as a device-signed data element under the namespace `urn:paso:sca:1`.

| Data element   | CBOR type      |
|----------------|----------------|
| `risk_signals` | array of maps  |

Each envelope is encoded as a CBOR map. Within it, `type`, `collected_at`, and `status` are `tstr`; string members of `value` are `tstr`; numeric members of `value` are CBOR floats.

## 6 Verification

The Authorizing Party **SHALL** perform the following checks in addition to those in [PaSO Proof Verify], after the SCA response claims verification:

1. **Presence of required signals.** Determine the required signal set for the matched transaction data type (the union defined in Section 4.1). For every required signal, verify that an envelope with the matching `type` is present in the `risk_signals` array, with any `status`. If a required signal's envelope is missing, the Authorizing Party **SHALL** reject the transaction.

2. **Envelope well-formedness.** For each envelope, verify that `type` has the `urn:paso:risk:` prefix, `collected_at` is a valid [ISO8601] timestamp, `status` is one of `ok`, `unavailable`, or `denied`, and `value` is present if and only if `status` is `ok`. When `value` is present, verify it conforms to the schema for the signal type. If any envelope is malformed, the Authorizing Party **SHALL** reject the transaction.

3. **Freshness.** Verify that each `collected_at` is within an acceptable window relative to the transaction. The acceptable window is a matter of Transaction Data Type Rulebook or Authorizing Party policy and is not fixed by this module.

4. **Policy evaluation.** Interpreting signal values to reach a risk decision is the Authorizing Party's own policy and is out of scope for this module.

Envelopes for signal types the Authorizing Party does not recognise, and optional signals, **MAY** be ignored.

## 7 References

| Reference             | Description                                                                                                                |
|-----------------------|----------------------------------------------------------------------------------------------------------------------------|
| [PaSO Core]           | [PaSO Core](../paso-core.md)                                                                                               |
| [PaSO Proof Metadata] | [PaSO Proof: Metadata Module](paso-proof-metadata.md)                                                                      |
| [PaSO Proof Verify]   | [PaSO Proof: Verify Module](paso-proof-verify.md)                                                                          |
| [RFC2119]             | [RFC 2119 — Key words for use in RFCs](https://www.rfc-editor.org/rfc/rfc2119.html)                                        |
| [RFC8174]             | [RFC 8174 — Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words](https://www.rfc-editor.org/rfc/rfc8174.html)        |
| [SD-JWT-VC]           | [SD-JWT-based Verifiable Credentials](https://datatracker.ietf.org/doc/draft-ietf-oauth-sd-jwt-vc/)                        |
| [mdoc]                | [ISO/IEC 18013-5:2021 — Mobile driving licence application](https://www.iso.org/standard/69084.html)                       |
| [ISO8601]             | [ISO 8601 — Date and time format](https://www.iso.org/iso-8601-date-and-time-format.html)                                  |

## Annex A: Examples

_**Note**: This annex is **informative**._

### A.1 Risk Signals Array

A `risk_signals` array for a transaction that required geolocation and call activity, and optionally device motion:

```json
[
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
    "status": "denied"
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
  "amr": ["pin", "hwk", "bio_strong", "face"],
  "display_locale": "de",
  "transaction_data_hash": "OJcnQQByvV1iTYxiQQQx4dact-TNnSG-Ku_cs_6g55Q",
  "transaction_data_hash_alg": "sha-256",
  "risk_signals": [
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

A `transaction_data_types` entry declaring required and optional risk signals (per [PaSO Proof Metadata]):

```json
{
  "type": "urn:paso:sca:global:payment:1",
  "risk_signals": [
    { "type": "urn:paso:risk:global:geolocation:1", "required": true },
    { "type": "urn:paso:risk:global:call_activity:1", "required": true },
    { "type": "urn:paso:risk:global:device_motion:1", "required": false }
  ]
}
```
````

- [ ] **Step 2: Verify the site builds with the new file**

Run: `cd docs && bundle exec jekyll build`
Expected: build completes with no errors; `docs/_site/specs/proof/paso-proof-risk-signals.html` exists.

- [ ] **Step 3: Verify key content is present**

Run: `grep -c "urn:paso:risk:" docs/specs/proof/paso-proof-risk-signals.md`
Expected: a count of at least 10 (framework, three signal types, examples).

- [ ] **Step 4: Commit**

```bash
git add docs/specs/proof/paso-proof-risk-signals.md
git commit -m "docs(specs): add PaSO Proof Risk Signals module"
```

---

### Task 2: Wire `risk_signals` into PaSO Core §6

**Files:**
- Modify: `docs/specs/paso-core.md` (§6.1 SCA Response Claims table; §6.4 mdoc data-element table; §8 References)

**Interfaces:**
- Consumes: the `risk_signals` claim name and semantics from Task 1.
- Produces: the Core §6.1 claim row that Task 4's verification references.

- [ ] **Step 1: Add the `risk_signals` row to the §6.1 SCA Response Claims table**

In `docs/specs/paso-core.md`, in the Section 6.1 claims table, add this row immediately after the `wallet_instance_version` row (keep the existing table formatting):

```markdown
| `risk_signals`              | conditional | An array of risk-signal envelopes per [PaSO Risk Signals]. **REQUIRED** when the matched transaction data type has one or more required risk signals; absent otherwise.                                                                       |
```

- [ ] **Step 2: Add the `risk_signals` row to the §6.4 mdoc table**

In the Section 6.4 `DeviceNameSpaces` data-element table (namespace `urn:paso:sca:1`), add this row after the `wallet_instance_version` row:

```markdown
| `risk_signals`              | array of maps |
```

- [ ] **Step 3: Add the reference entry to §8 References**

In the Section 8 References table, add this row (place it after the `[PaSO Proof Metadata]` row):

```markdown
| [PaSO Risk Signals]   | [PaSO Proof: Risk Signals Module](proof/paso-proof-risk-signals.md)                                                         |
```

- [ ] **Step 4: Verify references resolve and the site builds**

Run: `grep -n "PaSO Risk Signals" docs/specs/paso-core.md && cd docs && bundle exec jekyll build`
Expected: two matches (the §6.1 row and the §8 reference row); build succeeds.

- [ ] **Step 5: Commit**

```bash
git add docs/specs/paso-core.md
git commit -m "docs(specs): reference risk_signals claim in PaSO Core"
```

---

### Task 3: Extend the Metadata module with `risk_signals`

**Files:**
- Modify: `docs/specs/proof/paso-proof-metadata.md` (the `transaction_data_types` section and its References table)

**Interfaces:**
- Consumes: the metadata `risk_signals` declaration shape from Task 1 (array of `{ type, required }`).
- Produces: the normative definition of the `risk_signals` metadata member referenced by Task 1 §4.1 and Task 4.

- [ ] **Step 1: Read the metadata module to locate the `transaction_data_types` definition**

Run: `grep -n "transaction_data_types\|^## \|^### " docs/specs/proof/paso-proof-metadata.md`
Expected: the section that defines the `transaction_data_types` structure and its per-type members. Note the section number (call it `<N>`) for the reference wording below.

- [ ] **Step 2: Add the `risk_signals` member definition**

In the section that enumerates the members of each `transaction_data_types` entry, add the following definition after the existing members (match the document's existing member-description style):

```markdown
- **`risk_signals`**: **OPTIONAL** (array). Declares the risk signals that apply to this transaction data type, per [PaSO Risk Signals]. Each element is an object with:
  - **`type`**: **REQUIRED** (string). A risk-signal type URN (`urn:paso:risk:<domain>:<suffix>:<version>`).
  - **`required`**: **OPTIONAL** (boolean, default `false`). When `true`, the Wallet **SHALL** include this signal's envelope in the holder binding proof, reporting its `status` even when the value cannot be measured.
```

- [ ] **Step 3: Add the reference entry**

In the References table of `docs/specs/proof/paso-proof-metadata.md`, add:

```markdown
| [PaSO Risk Signals]   | [PaSO Proof: Risk Signals Module](paso-proof-risk-signals.md)                                                              |
```

- [ ] **Step 4: Verify and build**

Run: `grep -n "risk_signals\|PaSO Risk Signals" docs/specs/proof/paso-proof-metadata.md && cd docs && bundle exec jekyll build`
Expected: matches for the new member and reference; build succeeds.

- [ ] **Step 5: Commit**

```bash
git add docs/specs/proof/paso-proof-metadata.md
git commit -m "docs(specs): declare risk_signals in transaction_data_types metadata"
```

---

### Task 4: Add risk-signal verification to the Verify module

**Files:**
- Modify: `docs/specs/proof/paso-proof-verify.md` (Section 3 Verification Procedure; References table)

**Interfaces:**
- Consumes: the `risk_signals` claim (Task 2), the metadata declaration (Task 3), and the verification steps authored in Task 1 §6.

- [ ] **Step 1: Add a risk-signals verification step**

In `docs/specs/paso-proof-verify.md` Section 3, add a new numbered step immediately after step 5 (Payload verification), renumbering nothing else (it becomes step 6, before the closing "If any check fails…" sentence):

```markdown
6. **Risk-signals verification** per [PaSO Risk Signals] Section 6:
   - Determine the required signal set for the matched transaction data type (the union of the issuer metadata `risk_signals` declaration and the Transaction Data Type Rulebook).
   - Verify that every required signal is present in the `risk_signals` claim, with any `status`.
   - Verify each envelope is well-formed and that its `collected_at` is within an acceptable freshness window.
   - Interpreting signal values to reach a risk decision is out of scope and left to Authorizing Party policy.
```

- [ ] **Step 2: Add the reference entry**

In the References table of `docs/specs/proof/paso-proof-verify.md`, add:

```markdown
| [PaSO Risk Signals]   | [PaSO Proof: Risk Signals Module](paso-proof-risk-signals.md)                                                              |
```

- [ ] **Step 3: Verify and build**

Run: `grep -n "Risk-signals verification\|PaSO Risk Signals" docs/specs/proof/paso-proof-verify.md && cd docs && bundle exec jekyll build`
Expected: matches for the new step and reference; build succeeds.

- [ ] **Step 4: Commit**

```bash
git add docs/specs/proof/paso-proof-verify.md
git commit -m "docs(specs): verify risk signals in PaSO Proof Verify"
```

---

### Task 5: Link the new module on the site index

**Files:**
- Modify: `docs/index.html` (the `spec-grid` ordered list)

**Interfaces:**
- Consumes: the published spec path `specs/proof/paso-proof-risk-signals.html` from Task 1.

- [ ] **Step 1: Add a spec-grid entry**

In `docs/index.html`, inside the `<ol class="spec-grid">` list, add a new `<li>` immediately after the "Proof · Log" entry (which is item 6), using the next number (7):

```html
      <li>
        <a href="{{ '/specs/proof/paso-proof-risk-signals.html' | relative_url }}">
          <span class="spec-grid__n">7</span>
          <h3>Proof · Risk Signals</h3>
          <p>Wallet-asserted risk signals carried in the holder binding proof.</p>
        </a>
      </li>
```

- [ ] **Step 2: Verify and build**

Run: `grep -n "paso-proof-risk-signals" docs/index.html && cd docs && bundle exec jekyll build`
Expected: one match; build succeeds; `docs/_site/index.html` contains the new link.

- [ ] **Step 3: Commit**

```bash
git add docs/index.html
git commit -m "docs(site): link Risk Signals module from index"
```

---

## Self-Review

**Spec coverage** (design doc → task):
- Framework/envelope/URN/status → Task 1 §2. ✓
- Three starter signals → Task 1 §3. ✓
- Collection trigger (union of metadata + rulebook) → Task 1 §4 + Task 3 (metadata member). ✓
- Transport (`risk_signals` claim, SD-JWT-VC, mdoc) → Task 1 §5 + Task 2 (Core §6.1/§6.4). ✓
- Verification → Task 1 §6 + Task 4 (Verify §3). ✓
- Consent out of scope → Task 1 §1.2. ✓
- Cross-module additive edits → Tasks 2, 3, 4. ✓
- Site index link → Task 5. ✓

**Placeholder scan:** No TBD/TODO; all inserted text is literal. Task 3 Step 1 requires locating the metadata section number by grep before editing — this is a read step, not a placeholder, because the exact heading number in that file is not assumed.

**Type/name consistency:** `risk_signals` (claim + metadata member), envelope members `type`/`collected_at`/`status`/`value`, status enum `ok`/`unavailable`/`denied`, and the three URNs are identical across Tasks 1–4 and match the approved design.