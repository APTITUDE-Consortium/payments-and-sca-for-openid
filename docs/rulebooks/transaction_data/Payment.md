# Basic Payments

**Type identifier**: `urn:paso:sca:global:payment:1`

A single payment. The User authorizes a one-time transfer of a specific amount to a specific Payee.

Attestation Providers **SHALL** use the claims exactly as specified below. Attestation Providers **MAY** add additional claims without a `display` array for internal processing purposes. The order of claims in the table defines the normative claim order; Attestation Providers **SHALL** list the claims in their `claims` arrays in this order. Value types are as defined in [PaSO View]. Because this transaction data type is always rendered statically (Section 3), its entry in the credential metadata **MAY** be an empty object; where `claims` are provided, the requirements of this paragraph apply.

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

This transaction data type is always rendered with static rendering per [PaSO View] Section 5. This section is its Static Presentation section per [PaSO Core] Section 5.3. The Wallet uses no display data from the credential metadata.

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

- **Affirmative action**: the User authorises a one-time payment of `amount` to the Payee identified by `payee.name`. The Wallet labels this action with the affirmative action label of Section 3.3.
- **Denial action**: the User declines the payment. The Wallet labels this action with the denial action label of Section 3.3.

### 3.3 Strings

The static presentation is available in the languages `en`, `de` and `fr`. The fallback language is `en`. The Wallet **SHALL** use the following strings exactly, in the language selected per [PaSO View] Section 5.4:

| Element                     | `en`            | `de`                        | `fr`                  |
|-----------------------------|-----------------|-----------------------------|-----------------------|
| Title of the consent screen | Confirm Payment | Zahlung bestätigen          | Confirmer le paiement |
| Label of `amount`           | Amount          | Betrag                      | Montant               |
| Label of `payee.name`       | Payee           | Zahlungsempfänger           | Bénéficiaire          |
| Label of `payee.logo`       | Payee logo      | Logo des Zahlungsempfängers | Logo du bénéficiaire  |
| Affirmative action label    | Pay             | Bezahlen                    | Payer                 |
| Denial action label         | Cancel          | Abbrechen                   | Annuler               |

No security hint is defined for this transaction data type.

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

Corresponding `transaction_data_types` entry in the signed credential metadata. Because this type is rendered statically, the entry needs no display metadata ([PaSO View] Section 5.2):

```json
{
  "urn:paso:sca:global:payment:1": {}
}
```

A Wallet whose locale priority list starts with `en` renders the static presentation in English, using the strings of Section 3.3. This Wallet's layout includes the optional logo:

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

### A.2 Static Rendering in French

The same transaction as in A.1, rendered for a User whose locale priority list is `fr`. The Lookup per [PaSO View] Section 5.4 selects `fr`, so the Wallet uses the French strings of Section 3.3. This Wallet's layout omits the optional logo:

```text
┌────────────────────────────────────────────┐
│                                            │
│           Confirmer le paiement            │
│                                            │
│  Montant                                   │
│    49,99 €                                 │
│                                            │
│  Bénéficiaire                              │
│    Acme Store                              │
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
  "display_locale": "fr"
}
```
