# Basic Payments

**Type identifier**: `urn:paso:sca:global:payment:1`

A single payment. The User authorizes a one-time transfer of a specific amount to a specific Payee.

Attestation Providers **SHALL** use the claims exactly as specified below. Attestation Providers **MAY** add additional claims without a `display` array for internal processing purposes. The order of claims in the table defines the normative claim order; Attestation Providers **SHALL** list the claims in their `claims` arrays in this order. Value types are as defined in [PaSO View].

## 1 Transaction Data Claims

| `path`                        | `mandatory` | `value_type`          | `display` | Description                                                                                                          |
|-------------------------------|-------------|-----------------------|-----------|----------------------------------------------------------------------------------------------------------------------|
| `["transaction_id"]`          | false       | _(text)_              | no        | Identifier of the service's transaction (e.g., a checkout session ID).                                               |
| `["amount"]`                  | true        | `iso_currency_amount` | yes       | Amount and currency of the payment (e.g., `"49.99 EUR"`).                                                            |
| `["payee", "name"]`           | true        | _(text)_              | yes       | Name of the Payee to whom the payment is being made.                                                                 |
| `["payee", "id"]`             | true        | _(text)_              | no        | The Payee's national tax identifier or business registry number. Payment networks must accept and verify both forms. |
| `["payee", "logo"]`           | false       | `image`               | yes       | Logo of the Payee. **MAY** be omitted in static rendering (Section 3).                                               |
| `["payee", "logo#integrity"]` | false       | _(text)_              | no        | [W3C.SRI] hash of the logo content. **MUST** be present if `payee.logo` is a resolvable URL.                         |

## 2 Authorizing Party Verification

In addition to the verification procedure defined in [PaSO Proof Verify], the Authorizing Party verifies the following for this transaction data type:

1. The `payee.id` is verified against the relevant national tax authority or business registry. The `payee.name` must match the name associated with the `payee.id` in those records.
2. The `amount` conforms to the payment network's rules (e.g., valid currency, supported amount range).
3. If a `transaction_id` is present, the Authorizing Party may use it for end-to-end correlation with the Relying Party's systems.

## 3 Static Presentation

This transaction data type supports static rendering per [PaSO View] Section 5. This section is the Static Presentation section required by [PaSO Core] Section 5.3.

### 3.1 Displayed Claims

| Claim                  | Static rendering  | Display obligations                                                                                                                             |
|------------------------|-------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| `amount`               | **SHALL** display | Formatted per `iso_currency_amount` ([PaSO View] Section 3), with the full amount and currency. The most prominent value on the consent screen. |
| `payee.name`           | **SHALL** display | Shown in full and clearly identified as the recipient of the payment.                                                                           |
| `payee.logo`           | **MAY** display   | If displayed, the `image` rules of [PaSO View] Section 3 apply. The logo **MUST NOT** replace or obscure `payee.name`.                          |
| `transaction_id`       | not displayed     | —                                                                                                                                               |
| `payee.id`             | not displayed     | —                                                                                                                                               |
| `payee.logo#integrity` | not displayed     | —                                                                                                                                               |

The `amount` and `payee.name` **SHALL** be visible on the same screen as the affirmative action.

### 3.2 Actions

- **Affirmative action**: the User authorises a one-time payment of `amount` to the Payee identified by `payee.name`. The Wallet's label for this action **SHALL** convey that a payment is being made (e.g., "Pay").
- **Denial action**: the User declines the payment.

## 4 References

| Reference           | Description                                                         |
|---------------------|---------------------------------------------------------------------|
| [PaSO Core]         | [PaSO Core](../../specifications/paso-core.md)                               |
| [PaSO Proof Verify] | [PaSO Proof: Verify Module](../../specifications/proof/paso-proof-verify.md) |
| [PaSO View]         | [PaSO View](../../specifications/paso-view.md)                               |
| [W3C.SRI]           | [Subresource Integrity](https://www.w3.org/TR/SRI/)                 |

## Annex A: Examples

_**Note**: This annex is **informative**._

### A.1 One-Time Checkout Payment

Transaction data for a single payment of €49.99 to an online retailer named "Acme Store", including the Payee's verified logo:

```json
{
  "type": "urn:paso:sca:global:payment:1",
  "credential_ids": ["bank_payment_card"],
  "payload": {
    "transaction_id": "chk_2026-06-02_3f9b",
    "amount": "49.99 EUR",
    "payee": {
      "name": "Acme Store",
      "id": "DE987654321",
      "logo": "https://cdn.acme.example/logo.png",
      "logo#integrity": "sha256-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz="
    }
  }
}
```

Corresponding `transaction_data_types` entry in the signed credential metadata:

```json
{
  "urn:paso:sca:global:payment:1": {
    "claims": [
      { "path": ["transaction_id"] },
      {
        "path": ["amount"],
        "mandatory": true,
        "value_type": "iso_currency_amount",
        "display": [
          { "locale": "en", "name": "Amount" },
          { "locale": "de", "name": "Betrag" }
        ]
      },
      {
        "path": ["payee", "name"],
        "mandatory": true,
        "display": [
          { "locale": "en", "name": "Payee" },
          { "locale": "de", "name": "Empfänger" }
        ]
      },
      { "path": ["payee", "id"], "mandatory": true },
      {
        "path": ["payee", "logo"],
        "value_type": "image",
        "display": [
          { "locale": "en", "name": "Payee logo" },
          { "locale": "de", "name": "Logo des Empfängers" }
        ]
      },
      { "path": ["payee", "logo#integrity"] }
    ],
    "ui_labels": {
      "transaction_title": [
        { "locale": "en", "value": "Confirm Payment" },
        { "locale": "de", "value": "Zahlung bestätigen" }
      ],
      "affirmative_action_label": [
        { "locale": "en", "value": "Pay" },
        { "locale": "de", "value": "Bezahlen" }
      ]
    }
  }
}
```

The Wallet renders, in claim order: **Amount** — €49.99, **Payee** — Acme Store, **Payee logo** — (resolved + SRI-verified image).

```text
┌────────────────────────────────────────────┐
│                                            │
│            Confirm Payment                 │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│  Amount                                    │
│    €49.99                                  │
│                                            │
│  Payee                                     │
│    Acme Store                              │
│                                            │
│  Payee logo                                │
│    ┌──────────────────┐                    │
│    │   [ACME logo]    │                    │
│    │   (PNG, SRI ✓)   │                    │
│    └──────────────────┘                    │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│       [ Cancel ]        [ Pay ]            │
│                                            │
└────────────────────────────────────────────┘
```

### A.2 Static Rendering

The same transaction as in A.1, rendered by a Wallet that implements this rulebook and uses static rendering per [PaSO View] Section 5. The Wallet's user interface language is French, which the credential metadata does not serve. Because the metadata of A.1 provides no `security_hint`, the Wallet uses its own French labels and layout and omits the optional logo:

```text
┌────────────────────────────────────────────┐
│                                            │
│            Confirmer le paiement           │
│                                            │
│                 49,99 €                    │
│                                            │
│      à  Acme Store                         │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│       [ Annuler ]       [ Payer ]          │
│                                            │
└────────────────────────────────────────────┘
```

The corresponding SCA response claims include, among others:

```json
{
  "display_locale": "fr",
  "render_mode": "static"
}
```
