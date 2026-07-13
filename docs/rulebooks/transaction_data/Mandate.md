---
title: "Mandate Rulebook (urn:paso:sca:global:mandate[:<subtype>]:1)"
description: A generic Mandate transaction data type for authorizing a named party (a human delegate, a business, or a software agent) to act on the User's behalf under defined conditions and limits.
---

# Transaction Data Type Rulebook: Base Mandate

**Type identifier**: `urn:paso:sca:global:mandate:1` (no subtype) or `urn:paso:sca:global:mandate:<subtype>:1` (with subtype).

A Mandate. The User authorizes a named **Mandatee** — a human delegate, a legal entity, or a software agent — to act on the User's behalf within a defined scope, under explicit conditions and limits, and for a bounded period of time.

The rulebook is intentionally generic. It covers financial mandates (e.g., e-mandates for merchant-initiated transactions), non-financial delegations (e.g., authorizing another person to manage an account), and agentic-commerce mandates (e.g., authorizing an AI agent to make a constrained purchase). An OPTIONAL embedded `payment_payload`, conforming to the [Payment] rulebook, accommodates use cases in which the mandate authorizes one or more concrete payments to a specific Payee.

Unlike the [Generic] rulebook, the Mandate rulebook defines a fixed claim schema. A Wallet implementing this rulebook ships with built-in knowledge of every claim, its position, and its rendering. The Mandate rulebook therefore **MAY** be used with Wallets that do not implement [PaSO Proof Metadata].

Attestation Providers **SHALL** use the claims exactly as specified below. Attestation Providers **MAY** add additional claims without a `display` array for internal processing purposes. The order of claims in the table defines the normative claim order; Attestation Providers **SHALL** list the claims in their `claims` arrays in this order. Value types are as defined in [PaSO View].

## 1 Type Identifier and Subtypes

Per [PaSO Core] Section 5.2, the `<suffix>` portion of a PaSO transaction data type URN **MAY** consist of one or more colon-separated segments. This rulebook applies to every URN matching either of the following two forms:

```
urn:paso:sca:global:mandate:1
urn:paso:sca:global:mandate:<subtype>:1
```

Where `<subtype>` is an **OPTIONAL** single segment chosen by the Attestation Provider to scope the rulebook to a specific use case. A `<subtype>` segment:

- **MUST** be a lowercase ASCII string composed of letters, digits, and hyphens (`[a-z0-9-]+`),
- **MUST NOT** itself contain a colon,
- **SHOULD** be a short, human-recognisable identifier of the use case (e.g., `emandate`, `agentic`, `delegation`, `subscription`).

The subtype affects only the type identifier and the credential metadata routing; it does **not** change the payload schema, rendering rules, or verification requirements defined in this rulebook. A Wallet implementing this rulebook **SHALL** treat all subtype variants as equivalent for rendering purposes and **MAY** use the subtype to refine wording in the consent UI (e.g., "Authorize agent" vs. "Authorize direct debit"). A PaSO Credential **MAY** support multiple subtypes (and the no-subtype form) by declaring a separate entry in `transaction_data_types` for each.

This rulebook does **not** define a normative registry of subtype values. Coordination between Attestation Provider and Relying Party is sufficient.

Within the rest of this document, the phrase "this type identifier" refers to any URN matching the above pattern.

## 2 Transaction Data Claims

| `path`                            | `mandatory` | `value_type`          | `display` | Description                                                                                                                                                                                                                       |
|-----------------------------------|-------------|-----------------------|-----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `["transaction_id"]`              | false       | _(text)_              | no        | Identifier of the Relying Party's interaction with the User (e.g., a checkout or onboarding session ID). Internal value; **MUST NOT** be displayed.                                                                               |
| `["mandate_id"]`                  | true        | _(text)_              | yes       | Stable reference for the mandate, used for downstream enforcement, audit, and revocation (e.g., `"MND-2026-0042"`).                                                                                                                |
| `["mandatee", "name"]`            | true        | _(text)_              | yes       | Human-readable name of the Mandatee — the party authorized to act on the User's behalf. **MAY** be a person, a legal entity, or a software agent.                                                                                 |
| `["mandatee", "id"]`              | false       | _(text)_              | no        | Stable identifier of the Mandatee in a registry appropriate to its kind: a national tax identifier or business registry number for a legal entity, a decentralized identifier (DID) or other persistent identifier for an agent.  |
| `["mandatee", "logo"]`            | false       | `image`               | yes       | Logo of the Mandatee. A dedicated UI **MAY** choose to not display it.                                                                                                                                                            |
| `["mandatee", "logo#integrity"]`  | false       | _(text)_              | no        | [W3C.SRI] hash of the logo content. **MUST** be present if `mandatee.logo` is a resolvable URL.                                                                                                                                   |
| `["action"]`                      | true        | _(text)_              | yes       | Short description of what the Mandatee is authorized to do (e.g., `"Collect monthly subscription"`, `"Purchase noise-cancelling headphones"`, `"Manage account on my behalf"`).                                                    |
| `["conditions"]`                  | false       | `mini_markdown`       | yes       | Detailed conditions under which the authorization applies. Free-form text, rendered with `mini_markdown` per [PaSO View] so that bullet lists and emphasis are preserved (e.g., `"- Only from authorized retailers\n- Price ≤ €200"`). |
| `["max_amount"]`                  | false       | `iso_currency_amount` | yes       | Maximum monetary amount per use, where applicable (e.g., `"200.00 EUR"`). Omit for non-financial mandates.                                                                                                                          |
| `["max_count"]`                   | false       | _(text)_              | yes       | Maximum number of uses, where applicable (e.g., `"1"` for a single-use mandate, `"24"` for at most 24 collections). Omit if uses are not bounded by count.                                                                          |
| `["period"]`                      | false       | _(text)_              | yes       | The period over which `max_amount` and `max_count` apply, where applicable (e.g., `"per month"`, `"per calendar year"`, `"over the validity of this mandate"`).                                                                     |
| `["valid_from"]`                  | false       | `iso_date`            | yes       | First date on which the mandate becomes effective. If omitted, the mandate is effective immediately upon Authorizing Party registration.                                                                                          |
| `["valid_until"]`                 | true        | `iso_date`            | yes       | Last date on which the mandate is effective. The Authorizing Party **SHALL NOT** honor the mandate after this date.                                                                                                                |
| `["payment_payload"]`             | false       | _(object)_            | no        | An embedded payload of type `urn:paso:sca:global:payment:1` as defined in the [Payment] rulebook. See Section 2.2.                                                                                                                  |

### 2.1 Rendering

A Wallet implementing this rulebook **SHALL** render the displayable claims in the table order above, applying [PaSO View] formatting rules for each `value_type`. The Wallet **MAY** group `max_amount`, `max_count`, and `period` into a single visual "limit" block. The Wallet **SHALL** ensure that every displayable claim has been shown to the User before enabling the confirmation action, as required by [PaSO Core] Section 5.3 and [PaSO View] Section 2.

### 2.2 Embedded Payment Payload

When `payment_payload` is present, its value **SHALL** be a payload object conforming to the [Payment] rulebook (`urn:paso:sca:global:payment:1`). The Wallet **SHALL** render the `payment_payload` block as a clearly delimited section of the consent screen, immediately after the Mandate claims, and **SHALL** apply the Payment rulebook's display and verification semantics to its contents.

A `payment_payload` carries a single representative payment instance: for an e-mandate, this is typically the first or template collection; for an agentic-commerce mandate that authorizes a single purchase, it is the payment itself. The presence of `payment_payload` does not extend the mandate's authority beyond what is described by `action`, `conditions`, and the limit claims — the embedded payment is informational unless the mandate's `action` and `conditions` expressly authorize its execution.

## 3 Authorizing Party Verification

In addition to the verification procedure defined in [PaSO Proof Verify], the Authorizing Party verifies the following for this transaction data type:

1. The `type` URN matches one of the forms defined in Section 1 and the subtype segment (if present) conforms to the `[a-z0-9-]+` grammar.
2. `mandate_id` is present, is a non-empty string, and is unique within the Authorizing Party's mandate registry.
3. `mandatee.name` is present. If `mandatee.id` is present, the Authorizing Party verifies it against the appropriate registry (national tax authority or business registry for a legal entity; the agent registry referenced by the identifier scheme for a software agent) and verifies that `mandatee.name` matches the name associated with `mandatee.id` in that registry.
4. `action` is present and non-empty.
5. `valid_until` is present, parses as an [ISO 8601] date, and is not in the past at the time of verification. If `valid_from` is present, it parses as an [ISO 8601] date and is not later than `valid_until`.
6. If `max_amount` is present, it conforms to the payment network's rules (e.g., valid currency, supported amount range). If `period` is present alongside `max_amount` or `max_count`, the combination is supported by the Authorizing Party's enforcement engine.
7. If `payment_payload` is present, the Authorizing Party verifies it per the [Payment] rulebook's Section 2 and confirms that the embedded payment falls within the mandate's scope (`action`, `conditions`, limits, validity period).
8. If a `transaction_id` is present, the Authorizing Party **MAY** use it for end-to-end correlation with the Relying Party's systems.

## 4 References

| Reference           | Description                                                              |
|---------------------|--------------------------------------------------------------------------|
| [PaSO Core]         | [PaSO Core](../../specs/paso-core.md)                                    |
| [PaSO Proof Verify] | [PaSO Proof: Verify Module](../../specs/proof/paso-proof-verify.md)      |
| [PaSO Proof Metadata] | [PaSO Proof: Metadata Module](../../specs/proof/paso-proof-metadata.md) |
| [PaSO View]         | [PaSO View](../../specs/paso-view.md)                                    |
| [Generic]           | [Generic Rulebook](Generic.md)                                           |
| [Payment]           | [Payment Rulebook](Payment.md)                                           |
| [W3C.SRI]           | [Subresource Integrity](https://www.w3.org/TR/SRI/)                      |
| [ISO 8601]          | [ISO 8601 — Date and time representations](https://www.iso.org/iso-8601-date-and-time-format.html) |

## Annex A: Examples

_**Note**: This annex is **informative**._

### A.1 E-Mandate for Recurring Merchant-Initiated Payments (subtype `emandate`)

Transaction data for an e-mandate authorizing a streaming service to collect a recurring monthly subscription for up to 24 months:

```json
{
  "type": "urn:paso:sca:global:mandate:emandate:1",
  "credential_ids": ["bank_payment_card"],
  "payload": {
    "transaction_id": "chk_2026-06-02_3f9b",
    "mandate_id": "MND-2026-0042",
    "mandatee": {
      "name": "Streaming Co.",
      "id": "DE123456789"
    },
    "action": "Collect monthly subscription",
    "conditions": "The collection amount is fixed and matches the subscription plan in effect at the time of collection.",
    "max_amount": "19.99 EUR",
    "max_count": "24",
    "period": "over the validity of this mandate",
    "valid_from": "2026-06-03",
    "valid_until": "2028-06-02",
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

The Wallet renders, in claim order, the Mandate fields followed by the embedded Payment block:

```text
┌────────────────────────────────────────────┐
│                                            │
│        Authorize Recurring Payment         │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│  Mandate reference                         │
│    MND-2026-0042                           │
│                                            │
│  Authorized party                          │
│    Streaming Co.                           │
│                                            │
│  Authorized action                         │
│    Collect monthly subscription            │
│                                            │
│  Conditions                                │
│    The collection amount is fixed and      │
│    matches the subscription plan in        │
│    effect at the time of collection.       │
│                                            │
│  Maximum amount per use                    │
│    €19.99                                  │
│                                            │
│  Maximum uses                              │
│    24                                      │
│                                            │
│  Per period                                │
│    over the validity of this mandate       │
│                                            │
│  Valid from                                │
│    3 Jun 2026                              │
│                                            │
│  Valid until                               │
│    2 Jun 2028                              │
│                                            │
│  ┌─ First Collection ──────────────────┐   │
│  │                                     │   │
│  │  Amount                             │   │
│  │    €19.99                           │   │
│  │                                     │   │
│  │  Payee                              │   │
│  │    Streaming Co.                    │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│   [ Cancel ]    [ Authorize Mandate ]      │
│                                            │
└────────────────────────────────────────────┘
```

### A.2 Agentic-Commerce Purchase Mandate (subtype `agentic`)

Transaction data for a mandate handing a personal shopping agent the authority to buy a specific product class under price and source constraints. No `payment_payload` — the agent will produce a separate Payment transaction at execution time, bounded by this mandate's limits:

```json
{
  "type": "urn:paso:sca:global:mandate:agentic:1",
  "credential_ids": ["bank_payment_card"],
  "payload": {
    "transaction_id": "agent_task_2026-06-02_7c2a",
    "mandate_id": "MND-AGT-2026-0019",
    "mandatee": {
      "name": "ShopBot by ExampleAI",
      "id": "did:web:agents.exampleai.com:shopbot",
      "logo": "https://cdn.exampleai.com/shopbot-logo.png",
      "logo#integrity": "sha256-9zXk0Lq2nE7uH8sW4tY1pR3vQ6cB5aD8fG2hJ4kL6mN="
    },
    "action": "Purchase noise-cancelling over-ear headphones",
    "conditions": "- Only from retailers listed at trusted-retailers.example/v1\n- Total price (incl. tax & shipping) **must** be ≤ the maximum amount\n- Single purchase only; agent **must not** retry after a failed attempt",
    "max_amount": "200.00 EUR",
    "max_count": "1",
    "period": "over the validity of this mandate",
    "valid_until": "2026-06-09"
  }
}
```

```text
┌────────────────────────────────────────────┐
│                                            │
│           Authorize Agent Purchase         │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│  Mandate reference                         │
│    MND-AGT-2026-0019                       │
│                                            │
│  Authorized party                          │
│    ShopBot by ExampleAI                    │
│    ┌──────────────────┐                    │
│    │ [ShopBot logo]   │                    │
│    │ (PNG, SRI ✓)     │                    │
│    └──────────────────┘                    │
│                                            │
│  Authorized action                         │
│    Purchase noise-cancelling over-ear      │
│    headphones                              │
│                                            │
│  Conditions                                │
│    • Only from retailers listed at         │
│      trusted-retailers.example/v1          │
│    • Total price (incl. tax & shipping)    │
│      MUST be ≤ the maximum amount          │
│    • Single purchase only; agent MUST NOT  │
│      retry after a failed attempt          │
│                                            │
│  Maximum amount per use                    │
│    €200.00                                 │
│                                            │
│  Maximum uses                              │
│    1                                       │
│                                            │
│  Per period                                │
│    over the validity of this mandate       │
│                                            │
│  Valid until                               │
│    9 Jun 2026                              │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│   [ Cancel ]    [ Authorize Agent ]        │
│                                            │
└────────────────────────────────────────────┘
```

### A.3 Non-Financial Account Delegation (no subtype)

Transaction data for delegating limited account-management authority to another natural person, with no monetary limits. Demonstrates use of the rulebook outside payment contexts:

```json
{
  "type": "urn:paso:sca:global:mandate:1",
  "credential_ids": ["account_admin_credential"],
  "payload": {
    "mandate_id": "MND-DEL-2026-0007",
    "mandatee": {
      "name": "Alex Schmidt"
    },
    "action": "Manage account on my behalf",
    "conditions": "- View statements and download documents\n- **Must not** initiate transfers or change account-holder details\n- **Must not** add or remove other delegates",
    "valid_from": "2026-06-10",
    "valid_until": "2026-09-10"
  }
}
```

```text
┌────────────────────────────────────────────┐
│                                            │
│         Authorize Account Delegate         │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│  Mandate reference                         │
│    MND-DEL-2026-0007                       │
│                                            │
│  Authorized party                          │
│    Alex Schmidt                            │
│                                            │
│  Authorized action                         │
│    Manage account on my behalf             │
│                                            │
│  Conditions                                │
│    • View statements and download          │
│      documents                             │
│    • MUST NOT initiate transfers or        │
│      change account-holder details         │
│    • MUST NOT add or remove other          │
│      delegates                             │
│                                            │
│  Valid from                                │
│    10 Jun 2026                             │
│                                            │
│  Valid until                               │
│    10 Sep 2026                             │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│   [ Cancel ]    [ Authorize Delegate ]     │
│                                            │
└────────────────────────────────────────────┘
```
