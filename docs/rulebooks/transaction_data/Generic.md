# Generic 

**Type identifier**: `urn:paso:sca:global:generic:1` (no subtype) or `urn:paso:sca:global:generic:<subtype>:1` (with subtype).

A generic, free-form transaction data type for authorization use cases that do not have a dedicated rulebook of their own. Typical use cases include login confirmation, risk-based authentication step-up, account information access (AISP) consent, and the issuance of e-mandates for merchant-initiated transactions (MITs).

The payload carries a fixed `transaction_id`, an OPTIONAL embedded [Payment] payload, and up to ten Relying-Party-defined custom claims whose semantics are conveyed entirely through the credential metadata declared by the Attestation Provider.

Because the set and semantics of the custom claims are dynamic, this transaction data type **SHALL** only be used with Wallets that implement [PaSO Proof Metadata] and [PaSO View]. A PaSO Credential that supports this rulebook **SHALL** declare every claim it admits in its signed credential metadata per [PaSO Proof Metadata] Section 3.1, including the `display` arrays and `value_type` hints required to render the claim generically.

Attestation Providers **SHALL** use the claims exactly as specified below. Attestation Providers **MAY** add additional claims without a `display` array for internal processing purposes, subject to the property-count limit in Section 2. The order of claims in the `claims` array of the credential metadata is not authoritative for this type; see Section 3 for the rendering order rule.

## 1 Type Identifier and Subtypes

Per [PaSO Core] Section 5.2, the `<suffix>` portion of a PaSO transaction data type URN **MAY** consist of one or more colon-separated segments. This rulebook applies to every URN matching either of the following two forms:

```
urn:paso:sca:global:generic:1
urn:paso:sca:global:generic:<subtype>:1
```

Where `<subtype>` is an **OPTIONAL** single segment chosen by the Attestation Provider to scope the rulebook to a specific use case. A `<subtype>` segment:

- **MUST** be a lowercase ASCII string composed of letters, digits, and hyphens (`[a-z0-9-]+`),
- **MUST NOT** itself contain a colon,
- **SHOULD** be a short, human-recognisable identifier of the use case (e.g., `login`, `rba`, `aisp`, `emandate`).

The subtype affects only the type identifier and the credential metadata routing; it does not change the payload schema, rendering rules, or verification requirements defined in this rulebook. A PaSO Credential **MAY** support multiple subtypes (and the no-subtype form) by declaring a separate entry in `transaction_data_types` for each, with `claims` arrays tailored to the respective use case.

This rulebook does **not** define a normative registry of subtype values. Coordination between Attestation Provider and Relying Party is sufficient.

Within the rest of this document, the phrase "this type identifier" refers to any URN matching the above pattern.

## 2 Credential Requirements

This rulebook defines no mandatory credential attributes beyond those required by [PaSO Core]. The PaSO Credential **MAY** carry attributes appropriate to the use cases the Attestation Provider intends to support (e.g., a Relying-Party-facing identifier for a login credential, an IBAN reference for an AISP credential).

A PaSO Credential supporting this transaction data type **SHALL**:

1. List each supported variant of the type identifier (per Section 1) in the `transaction_data_types` object of its signed credential metadata per [PaSO Proof Metadata] Section 3. A credential **MAY** list multiple subtype variants, each with its own `claims` array tailored to that use case.
2. Declare, in each entry's `claims` array, every payload claim that variant accepts — including each custom claim key. Payload claims that are not declared in the credential metadata render the `transaction_data` entry non-conforming per [PaSO Core] Section 7.4.2.

## 3 Transaction Data Claims

The payload object **SHALL** contain no more than **11 properties** in total. Of these:

- `transaction_id` is **REQUIRED**.
- `payment_payload` is **OPTIONAL**.
- The remaining slots **MAY** be used for up to **10 custom claims** defined by the Relying Party in coordination with the Attestation Provider, subject to the 11-property cap.

| `path`                 | `mandatory` | `value_type`            | `display` | Description                                                                                                                                                                                                                                              |
|------------------------|-------------|-------------------------|-----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `["transaction_id"]`   | true        | _(text)_                | no        | Unique identifier of the Relying Party's interaction with the User (e.g., a session ID, authentication request ID, or mandate reference). Internal value, **MUST NOT** be displayed.                                                                     |
| `["payment_payload"]`  | false       | _(object)_              | no        | An embedded payload of type `urn:paso:sca:global:payment:1` as defined in the [Payment] rulebook. **MAY** be used to leverage the payment data structure for authorization scenarios such as e-mandate setup for merchant-initiated transactions (MITs). |
| `["<custom_key>"]`     | false       | any [PaSO View] type    | yes       | A Relying-Party-defined custom claim. The value **MUST** be a JSON string or `null`. The key **MUST** be a string and **MUST** be declared in the credential metadata `claims` array with a localised `display` array.                                   |

The payload-property budget is fixed at 11 slots. The diagram below shows how the slots split between the reserved keys and the flexible custom-claim region:

```text
            ╔══════════════ payload (max 11 properties) ══════════════╗
slot  1 →   ║ transaction_id           REQUIRED, not displayed        ║
slot  2 →   ║ payment_payload          OPTIONAL (Payment rulebook)    ║
            ╠──── custom claims (up to 10, total cap still 11) ───────╣
slot  3 →   ║ <custom_key_1>           string | null                  ║
slot  4 →   ║ <custom_key_2>           string | null                  ║
slot  5 →   ║ <custom_key_3>           string | null                  ║
slot  6 →   ║ <custom_key_4>           string | null                  ║
slot  7 →   ║ <custom_key_5>           string | null                  ║
slot  8 →   ║ <custom_key_6>           string | null                  ║
slot  9 →   ║ <custom_key_7>           string | null                  ║
slot 10 →   ║ <custom_key_8>           string | null                  ║
slot 11 →   ║ <custom_key_9>           string | null                  ║
            ║ <custom_key_10>          ✗ blocked: 11-property cap     ║
            ╚═════════════════════════════════════════════════════════╝

If payment_payload is OMITTED:    transaction_id + up to 10 customs  = 11
If payment_payload is PRESENT:    transaction_id + payment_payload
                                                 + up to  9 customs  = 11
```

The 10-custom upper bound applies independently of the 11-property cap. The cap is always the binding constraint when `payment_payload` is present.

### 3.1 Custom Claims

Each custom claim **SHALL** satisfy all of the following:

1. The key **MUST** be a string and **MUST NOT** collide with `transaction_id` or `payment_payload`.
2. The value in the payload **MUST** be either a JSON string or `null`. Other JSON types render the `transaction_data` entry non-conforming.
3. The claim **MUST** be declared in the signed credential metadata's `claims` array for the matching type identifier (per Section 1), with a `display` array providing labels for every locale the credential metadata covers. The `value_type` **MAY** be omitted (in which case the value is rendered as plain text per [PaSO View] Section 3) or set to any [PaSO View] value type compatible with a string payload value (e.g., `mini_markdown`, `url`, `iso_date`, `iso_currency_amount`).
4. When the value is `null`, the Wallet **SHALL** render only the claim's label, with no associated value, in the position determined by Section 4. This applies regardless of the declared `value_type`.

### 3.2 Embedded Payment Payload

When `payment_payload` is present, its value **SHALL** be a payload object conforming to the [Payment] rulebook (`urn:paso:sca:global:payment:1`). The credential metadata for the matching type identifier **SHALL** declare each of the Payment rulebook's displayable claims as a nested claim under the `["payment_payload", ...]` path prefix, mirroring the `display` and `value_type` definitions of the [Payment] rulebook.

The Wallet **SHALL** render the `payment_payload` block as a clearly delimited section of the consent screen and **SHALL** apply the Payment rulebook's display and verification semantics to its contents.

## 4 Rendering

This rulebook defines a transaction-type-specific renderer that takes precedence over [PaSO View] Section 2 for the ordering of claims. All other [PaSO View] rules (locale selection, value-type formatting, label formatting, `security_hint` handling) apply unchanged.

The Wallet **SHALL** render the payload as follows:

1. Iterate over the properties of the payload object **in the order in which they appear in the JSON object** (insertion order, as required by [RFC8259] Section 4 for JSON object member ordering preservation in this rulebook).
2. For each property:
   - If the key is `transaction_id`, skip it (internal claim, no `display` array).
   - If the key is `payment_payload`, render its contents as a delimited sub-section per Section 3.2, applying the same insertion-order rule recursively to the embedded payload.
   - Otherwise, look up the matching claim in the credential metadata's `claims` array, format the label per its locale-matched `display` entry, and format the value per its `value_type` (or as plain text if no `value_type` is declared). If the value is `null`, display the label alone.
3. The Wallet **SHALL** ensure that every displayable claim — every custom claim and every displayable claim of an embedded `payment_payload` — has been shown to the User before enabling the confirmation action, as required by [PaSO Core] Section 5.3 and [PaSO View] Section 2.

If the credential metadata `claims` array does not declare an entry for a key present in the payload (other than `transaction_id` and `payment_payload`), the `transaction_data` entry is non-conforming and the Wallet **SHALL** exclude it per [PaSO Core] Section 7.4.2.

The `ui_labels` object in the credential metadata **SHOULD** include `transaction_title` and `affirmative_action_label` entries appropriate to the subtype (e.g., "Confirm Login", "Authorize Access", "Set Up Mandate"), as the default labels are payment-oriented and may mislead the User in non-payment contexts.

## 5 Authorizing Party Verification

In addition to the verification procedure defined in [PaSO Proof Verify], the Authorizing Party verifies the following for this transaction data type:

1. The `type` URN matches one of the forms defined in Section 1 and the subtype segment (if present) conforms to the `[a-z0-9-]+` grammar.
2. The payload object contains no more than 11 properties.
3. `transaction_id` is present and is a non-empty string.
4. If `payment_payload` is present, it conforms to the [Payment] rulebook and is verified per that rulebook's Section 3.
5. Every custom claim key is declared in the signed credential metadata used by the Wallet and every custom claim value is either a string or `null`.
6. The Authorizing Party **MAY** use `transaction_id` for end-to-end correlation with the Relying Party's systems.

## 6 References

| Reference             | Description                                                         |
|-----------------------|---------------------------------------------------------------------|
| [PaSO Core]           | [PaSO Core](../../specs/paso-core.md)                               |
| [PaSO Proof Metadata] | [PaSO Proof: Metadata Module](../../specs/proof/paso-proof-metadata.md) |
| [PaSO Proof Verify]   | [PaSO Proof: Verify Module](../../specs/proof/paso-proof-verify.md) |
| [PaSO View]           | [PaSO View](../../specs/paso-view.md)                               |
| [Payment]             | [Payment Rulebook](Payment.md)                                      |
| [RFC8259]             | [RFC 8259 — The JavaScript Object Notation (JSON) Data Interchange Format](https://www.rfc-editor.org/rfc/rfc8259.html) |

## Annex A: Examples

_**Note**: This annex is **informative**._

### A.1 Login Consent (subtype `login`)

Transaction data for a simple login-confirmation flow at a relying party named "Acme Cloud":

```json
{
  "type": "urn:paso:sca:global:generic:login:1",
  "credential_ids": ["login_credential"],
  "payload": {
    "transaction_id": "sess_8f3c1b2e-4a6f-4e0a-9c1a-2d4b6f8a1c3e",
    "relying_party": "Acme Cloud",
    "device": "Chrome on macOS · Berlin, DE",
    "purpose": "Sign in to your account"
  }
}
```

Corresponding `transaction_data_types` entry in the signed credential metadata:

```json
{
  "urn:paso:sca:global:generic:login:1": {
    "claims": [
      { "path": ["transaction_id"], "mandatory": true },
      {
        "path": ["relying_party"],
        "display": [
          { "locale": "en", "name": "Relying Party" },
          { "locale": "de", "name": "Dienstanbieter" }
        ]
      },
      {
        "path": ["device"],
        "display": [
          { "locale": "en", "name": "Device" },
          { "locale": "de", "name": "Gerät" }
        ]
      },
      {
        "path": ["purpose"],
        "display": [
          { "locale": "en", "name": "Purpose" },
          { "locale": "de", "name": "Zweck" }
        ]
      }
    ],
    "ui_labels": {
      "transaction_title": [
        { "locale": "en", "value": "Confirm Sign-In" },
        { "locale": "de", "value": "Anmeldung bestätigen" }
      ],
      "affirmative_action_label": [
        { "locale": "en", "value": "Sign In" },
        { "locale": "de", "value": "Anmelden" }
      ]
    }
  }
}
```

The Wallet renders, in payload order: **Relying Party** — Acme Cloud, **Device** — Chrome on macOS · Berlin, DE, **Purpose** — Sign in to your account.

```text
┌────────────────────────────────────────────┐
│                                            │
│              Confirm Sign-In               │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│  Relying Party                             │
│    Acme Cloud                              │
│                                            │
│  Device                                    │
│    Chrome on macOS · Berlin, DE            │
│                                            │
│  Purpose                                   │
│    Sign in to your account                 │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│      [ Cancel ]        [ Sign In ]         │
│                                            │
└────────────────────────────────────────────┘
```

### A.2 Account Information Access Consent (subtype `aisp`)

Transaction data for an AISP consent with a `null` value to indicate a label-only line:

```json
{
  "type": "urn:paso:sca:global:generic:aisp:1",
  "credential_ids": ["bank_account_credential"],
  "payload": {
    "transaction_id": "aisp_2025-06-02_a91c",
    "service": "Budget Tracker by ExampleFin",
    "scope": "Account balances and transaction history (last 90 days)",
    "valid_until": "2026-09-02",
    "data_recipients_disclosed": null
  }
}
```

Credential metadata `transaction_data_types` entry (excerpt):

```json
{
  "urn:paso:sca:global:generic:aisp:1": {
    "claims": [
      { "path": ["transaction_id"], "mandatory": true },
      {
        "path": ["service"],
        "display": [{ "locale": "en", "name": "Service" }]
      },
      {
        "path": ["scope"],
        "display": [{ "locale": "en", "name": "Data shared" }]
      },
      {
        "path": ["valid_until"],
        "value_type": "iso_date",
        "display": [{ "locale": "en", "name": "Valid until" }]
      },
      {
        "path": ["data_recipients_disclosed"],
        "display": [{ "locale": "en", "name": "Recipients of your data have been disclosed separately by the service" }]
      }
    ]
  }
}
```

Because `data_recipients_disclosed` is `null` in the payload, the Wallet renders only its label (without a value) at the end of the list, regardless of the declared `value_type`.

```text
┌────────────────────────────────────────────┐
│                                            │
│         Authorize Data Sharing             │
│         (Wallet-provided title)            │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│  Service                                   │
│    Budget Tracker by ExampleFin            │
│                                            │
│  Data shared                               │
│    Account balances and transaction        │
│    history (last 90 days)                  │
│                                            │
│  Valid until                               │
│    2 Sep 2026                              │
│                                            │
│  Recipients of your data have been         │
│  disclosed separately by the service       │
│  (label-only — value was null)             │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│      [ Cancel ]        [ Authorize ]       │
│                                            │
└────────────────────────────────────────────┘
```

### A.3 E-Mandate Setup with Embedded Payment Payload (subtype `emandate`)

Transaction data for setting up an e-mandate for recurring merchant-initiated transactions, leveraging the embedded `payment_payload`:

```json
{
  "type": "urn:paso:sca:global:generic:emandate:1",
  "credential_ids": ["bank_payment_card"],
  "payload": {
    "transaction_id": "mandate_7c2a9e",
    "mandate_id": "MND-2026-0042",
    "frequency": "Monthly, up to 24 months",
    "payment_payload": {
      "transaction_id": "first_collection_001",
      "amount": "19.99 EUR",
      "payee": {
        "name": "Streaming Co.",
        "id": "DE123456789"
      }
    }
  }
}
```

Corresponding `transaction_data_types` entry — note that the embedded `payment_payload` claims are declared under the nested path prefix and mirror the [Payment] rulebook definitions:

```json
{
  "urn:paso:sca:global:generic:emandate:1": {
    "claims": [
      { "path": ["transaction_id"], "mandatory": true },
      {
        "path": ["mandate_id"],
        "display": [
          { "locale": "en", "name": "Mandate reference" },
          { "locale": "de", "name": "Mandatsreferenz" }
        ]
      },
      {
        "path": ["frequency"],
        "display": [
          { "locale": "en", "name": "Frequency" },
          { "locale": "de", "name": "Häufigkeit" }
        ]
      },
      { "path": ["payment_payload", "transaction_id"] },
      {
        "path": ["payment_payload", "amount"],
        "value_type": "iso_currency_amount",
        "display": [
          { "locale": "en", "name": "Amount per collection" },
          { "locale": "de", "name": "Betrag pro Einzug" }
        ]
      },
      {
        "path": ["payment_payload", "payee", "name"],
        "display": [
          { "locale": "en", "name": "Payee" },
          { "locale": "de", "name": "Empfänger" }
        ]
      },
      { "path": ["payment_payload", "payee", "id"] }
    ],
    "ui_labels": {
      "transaction_title": [
        { "locale": "en", "value": "Set Up Recurring Payment" },
        { "locale": "de", "value": "Daueraufträge einrichten" }
      ],
      "affirmative_action_label": [
        { "locale": "en", "value": "Authorize Mandate" },
        { "locale": "de", "value": "Mandat erteilen" }
      ],
      "security_hint": [
        { "locale": "en", "value": "Streaming Co. will be able to collect up to the amount shown each month for up to 24 months." }
      ]
    }
  }
}
```

The Wallet renders, in payload order: **Mandate reference** — MND-2026-0042, **Frequency** — Monthly, up to 24 months, followed by the `payment_payload` as a delimited sub-section showing **Amount per collection** — €19.99 and **Payee** — Streaming Co.

```text
┌────────────────────────────────────────────┐
│                                            │
│        Set Up Recurring Payment            │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│  Mandate reference                         │
│    MND-2026-0042                           │
│                                            │
│  Frequency                                 │
│    Monthly, up to 24 months                │
│                                            │
│  ┌─ Payment Details ───────────────────┐   │
│  │                                     │   │
│  │  Amount per collection              │   │
│  │    €19.99                           │   │
│  │                                     │   │
│  │  Payee                              │   │
│  │    Streaming Co.                    │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                            │
│  ⚠ Streaming Co. will be able to collect   │
│    up to the amount shown each month for   │
│    up to 24 months.                        │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│   [ Cancel ]    [ Authorize Mandate ]      │
│                                            │
└────────────────────────────────────────────┘
```

### A.4 Daily Transaction Limit Change (subtype `limit-change`)

Transaction data for a user-initiated change to the daily transaction limit on a payment card, showing both the current and the proposed new limit:

```json
{
  "type": "urn:paso:sca:global:generic:limit-change:1",
  "credential_ids": ["bank_payment_card"],
  "payload": {
    "transaction_id": "limit_chg_2026-06-02_4f7a",
    "scope": "Daily transaction limit",
    "current_limit": "1000.00 EUR",
    "new_limit": "2500.00 EUR",
    "effective_from": "2026-06-03"
  }
}
```

Corresponding `transaction_data_types` entry in the signed credential metadata:

```json
{
  "urn:paso:sca:global:generic:limit-change:1": {
    "claims": [
      { "path": ["transaction_id"], "mandatory": true },
      {
        "path": ["scope"],
        "display": [
          { "locale": "en", "name": "Limit type" },
          { "locale": "de", "name": "Limit-Typ" }
        ]
      },
      {
        "path": ["current_limit"],
        "value_type": "iso_currency_amount",
        "display": [
          { "locale": "en", "name": "Current limit" },
          { "locale": "de", "name": "Aktuelles Limit" }
        ]
      },
      {
        "path": ["new_limit"],
        "value_type": "iso_currency_amount",
        "display": [
          { "locale": "en", "name": "New limit" },
          { "locale": "de", "name": "Neues Limit" }
        ]
      },
      {
        "path": ["effective_from"],
        "value_type": "iso_date",
        "display": [
          { "locale": "en", "name": "Effective from" },
          { "locale": "de", "name": "Gültig ab" }
        ]
      }
    ],
    "ui_labels": {
      "transaction_title": [
        { "locale": "en", "value": "Confirm Limit Change" },
        { "locale": "de", "value": "Limit-Änderung bestätigen" }
      ],
      "affirmative_action_label": [
        { "locale": "en", "value": "Change Limit" },
        { "locale": "de", "value": "Limit ändern" }
      ],
      "security_hint": [
        { "locale": "en", "value": "Raising your daily limit increases the maximum amount that could be spent if your card is misused." },
        { "locale": "de", "value": "Eine Erhöhung des Tageslimits erhöht den Betrag, der bei Missbrauch maximal abfließen kann." }
      ]
    }
  }
}
```

The Wallet renders, in payload order: **Limit type** — Daily transaction limit, **Current limit** — €1,000.00, **New limit** — €2,500.00, **Effective from** — 3 Jun 2026.

```text
┌────────────────────────────────────────────┐
│                                            │
│          Confirm Limit Change              │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│  Limit type                                │
│    Daily transaction limit                 │
│                                            │
│  Current limit                             │
│    €1,000.00                               │
│                                            │
│  New limit                                 │
│    €2,500.00                               │
│                                            │
│  Effective from                            │
│    3 Jun 2026                              │
│                                            │
│  ⚠ Raising your daily limit increases the  │
│    maximum amount that could be spent if   │
│    your card is misused.                   │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│     [ Cancel ]    [ Change Limit ]         │
│                                            │
└────────────────────────────────────────────┘
```
