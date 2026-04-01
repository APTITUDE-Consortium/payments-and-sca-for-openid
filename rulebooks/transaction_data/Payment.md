# Transaction Data Type Rulebook: Base Payment

**Type identifier**: `urn:paso:sca:global:payment:1`

A single payment. The User authorizes a one-time transfer of a specific amount to a specific Payee.

Attestation Providers **SHALL** use the claims exactly as specified below. Attestation Providers **MAY** add additional claims without a `display` array for internal processing purposes. The order of claims in the table defines the normative claim order; Attestation Providers **SHALL** list the claims in their `claims` arrays in this order. Value types are as defined in [PaSO View].

## 1 Credential Requirements

PaSO Credentials used with this transaction data type **SHALL** contain the following attributes:

| Attribute                | Description                                                       |
|--------------------------|-------------------------------------------------------------------|
| `authorizing_party`      | The domain of the Authorizing Party's ingestion system.           |
| `authorizing_party_name` | The human-readable name of the Authorizing Party.                 |
| `payment_network`        | The hostname of the payment network that settles the transaction. |
| `payment_network_name`   | The human-readable name of the payment network.                   |

## 2 Transaction Data Claims

| `path`                        | `mandatory` | `value_type`          | `display` | Description                                                                                                          |
|-------------------------------|-------------|-----------------------|-----------|----------------------------------------------------------------------------------------------------------------------|
| `["transaction_id"]`          | false       | _(text)_              | no        | Identifier of the service's transaction (e.g., a checkout session ID).                                               |
| `["amount"]`                  | true        | `iso_currency_amount` | yes       | Amount and currency of the payment (e.g., `"49.99 EUR"`).                                                            |
| `["payee", "name"]`           | true        | _(text)_              | yes       | Name of the Payee to whom the payment is being made.                                                                 |
| `["payee", "id"]`             | true        | _(text)_              | no        | The Payee's national tax identifier or business registry number. Payment networks must accept and verify both forms. |
| `["payee", "logo"]`           | false       | `image`               | yes       | Logo of the Payee. A dedicated UI **MAY** choose to not display it.                                                  |
| `["payee", "logo#integrity"]` | false       | _(text)_              | no        | [W3C.SRI] hash of the logo content. **MUST** be present if `payee.logo` is a resolvable URL.                         |

## 3 Authorizing Party Verification

In addition to the verification procedure defined in [PaSO Proof Verify], the Authorizing Party verifies the following for this transaction data type:

1. The `payee.id` is verified against the relevant national tax authority or business registry. The `payee.name` must match the name associated with the `payee.id` in those records.
2. The `amount` conforms to the payment network's rules (e.g., valid currency, supported amount range).
3. If a `transaction_id` is present, the Authorizing Party may use it for end-to-end correlation with the Relying Party's systems.

## 4 References

| Reference           | Description                                                         |
|---------------------|---------------------------------------------------------------------|
| [PaSO Core]         | [PaSO Core](../../specs/paso-core.md)                               |
| [PaSO Proof Verify] | [PaSO Proof: Verify Module](../../specs/proof/paso-proof-verify.md) |
| [PaSO View]         | [PaSO View](../../specs/paso-view.md)                               |
| [W3C.SRI]           | [Subresource Integrity](https://www.w3.org/TR/SRI/)                 |
