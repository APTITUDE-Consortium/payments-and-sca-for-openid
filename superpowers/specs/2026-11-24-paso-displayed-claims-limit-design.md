# PaSO Displayed Claims Limit — Design

Date: 2026-11-24 · Branch: `draft-3` · Size: small change

## Intent

There is a fixed, spec-wide limit of **10 displayed claim values** per `transaction_data` entry.

There are two reasons for the limit:

1. A user can only review a limited amount of content on a real consent screen.
2. A single small, fixed number makes Wallets easier to implement. Every Wallet designs for at most 10 fields.

## Goals

- Metadata, whether signed or ad-hoc, declares at most 10 claims with a `display` array per transaction data type.
- A `transaction_data` entry may expand to at most 10 displayed claim values after array wildcard expansion. Every Wallet excludes an entry that expands to more, so the behaviour is identical across Wallets.
- Every Wallet can render 10 displayed claim values.

## Non-goals

- **Limiting UI elements.** `transaction_title`, the two action labels and `security_hint` do not count toward the 10. They already have their own length limits.
- **Limiting internal claims.** Claims without a `display` array are never rendered. The existing cap of 100 claim metadata objects stays.
- **Changing the Payment rulebook.** It has 3 displayed claims and is unaffected.

## Anti-goals

- **A per-Wallet choice.** The limit is not a minimum that Wallets may exceed. A transaction must not work in one Wallet and fail in another.
- **Truncation or partial display.** An entry over the limit is excluded entirely, as with oversized labels (PaSO View §6.2).

## Approaches considered

- **Chosen: a hard ceiling of 10.** The metadata constraint applies to issuers, and Wallets enforce the same cap on rendered values. It serves both goals: it bounds what the user sees, and it fixes the layout target for Wallets. The cost is that larger baskets and itemised transactions cannot be expressed.
- **Rejected: a minimum of 10.** Wallets would have to render at least 10 and could render more, replacing today's "at least 200". The same transaction would behave differently across Wallets. Relying Parties would keep sending more than 10 fields, so Wallets would still design for long screens.

## Changes

1. **`docs/specifications/paso-view.md` §2.** Replace the paragraph defining the Wallet-defined bound of at least 200 rendered items with a fixed limit:
   - What counts: the instances, present in the `payload`, of claims that have a `display` array, after array wildcard expansion.
   - What does not count: UI elements.
   - An entry with more than 10 such values is not compatible. The Wallet SHALL exclude it.
   - The Wallet SHALL be able to render 10.
2. **`paso-view.md` §5.3.** Change the clause "the bound on rendered items applies" to refer to the new limit.
3. **`paso-view.md` §6.** Add a short informative subsection, "Why the Number of Displayed Values Is Limited", explaining the two reasons for the limit.
4. **`docs/specifications/proof/paso-proof-metadata.md` §3.3.** Add a structural constraint: the `claims` array MUST NOT contain more than 10 claim metadata objects with a `display` array. The cap of 100 total claims stays. The existing rules then apply without further changes:
   - a type that violates the constraint is not supported;
   - ad-hoc metadata is validated against §3.3 per §5.3.

## Calls made (correct if wrong)

- **The count is independent of the rendering mode.** It uses the claims metadata and the payload even in static rendering, where the Wallet may omit some claims, such as the Payment logo. Compatibility therefore does not depend on which mode the Wallet picks.
- **Absent claims do not count.** An optional displayed claim that is not present in the `payload` is not one of the 10.
- **One commit per document**, following the static-rendering change.

## Left to the builder

- The exact normative wording, matching the surrounding style (bold **SHALL**/**MUST**, cross-references).