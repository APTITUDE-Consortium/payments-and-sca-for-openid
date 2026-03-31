# Transaction Data Type Rulebook: Base Payment

**Type identifier**: `urn:paso:sca:<network-domain>:payment:1`

A single payment. The User authorizes a one-time transfer of a specific amount to a specific Payee. The `<network-domain>` is the hostname of the payment network that settles the transaction, in reverse domain notation (e.g., `com.example.payments`).

The hostname **MAY** host a favicon that dedicated UIs can use to visually identify the payment network.

Attestation Providers **SHALL** use the claims exactly as specified below. Attestation Providers **MAY** add additional claims without a `display` array for internal processing purposes. The order of claims in the table defines the normative claim order; Attestation Providers **SHALL** list the claims in their `claims` arrays in this order. Value types are as defined in [PaSO View].

## 1 Claims

| `path`                        | `mandatory` | `value_type`          | `display` | Description                                                                                   |
|-------------------------------|-------------|-----------------------|-----------|-----------------------------------------------------------------------------------------------|
| `["transaction_id"]`          | false       | _(text)_              | no        | Identifier of the service's transaction (e.g., a checkout session ID).                        |
| `["amount"]`                  | true        | `iso_currency_amount` | yes       | Amount and currency of the payment (e.g., `"49.99 EUR"`).                                     |
| `["payee", "name"]`           | true        | _(text)_              | yes       | Name of the Payee to whom the payment is being made.                                          |
| `["payee", "id"]`             | true        | _(text)_              | no        | An identifier of the Payee understood by the payment network used to process the transaction. |
| `["payee", "logo"]`           | false       | `image`               | yes       | Logo of the Payee. A dedicated UI **MAY** choose to not display it.                           |
| `["payee", "logo#integrity"]` | false       | _(text)_              | no        | [W3C.SRI] hash of the logo content. **MUST** be present if `payee.logo` is a resolvable URL.  |

## 2 Extensions

Payment networks **MAY** extend this specification by defining a new Transaction Data Type Rulebook whose type identifier appends additional segments before the version number (e.g., `urn:paso:sca:<network-domain>:payment:recurring:1`).

An extension **SHALL** either:

- ensure the Wallet supports the extension's specific requirements before issuance, or
- support [PaSO View] and define all display metadata in the credential metadata so that the transaction data can be rendered generically.

For [PaSO View], the Wallet **MAY** display the payee as a custom widget with icon for all transaction data types that extend this one.

## 3 References

| Reference   | Description                                         |
|-------------|-----------------------------------------------------|
| [PaSO Core] | [PaSO Core](../../specs/paso-core.md)               |
| [PaSO View] | [PaSO View](../../specs/paso-view.md)               |
| [W3C.SRI]   | [Subresource Integrity](https://www.w3.org/TR/SRI/) |
