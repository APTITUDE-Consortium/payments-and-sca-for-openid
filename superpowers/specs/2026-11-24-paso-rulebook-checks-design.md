# PaSO: Who Checks the Rulebook — Design

Date: 2026-11-24 · Branch: `draft-3` · Size: small change · Origin: spec review finding #4 (`2026-11-24-spec-review.md`)

## Intent

Make each party's rulebook obligations match what that party can actually know.

- Wallets don't fetch rulebooks at runtime. A Wallet either hard-codes a rulebook or doesn't know it at all. If it doesn't, it can only render the type dynamically, from metadata.
- The Authorizing Party always checks conformance to the rulebook.
- The issuer writes transaction data type metadata according to the rulebook. The Relying Party builds the payload according to the rulebook.
- Ad-hoc metadata is the complete, self-contained definition of a type. It is left entirely to the Relying Party, and no rulebook stands behind it.

Today the specs contradict each other and ask the Wallet for checks it cannot perform:
- Core §5.1 says every type **SHALL** have a published rulebook. `index.md` §6.2 says ad-hoc metadata serves "types without a published rulebook".
- Core §7.5 condition 3 requires the Wallet to reject payload fields "not declared by the rulebook".
- Risk §4.1 steps 1 and 3 and Risk §7.2 require the Wallet to apply the profiles, signals and encryption mandates that the rulebook references.

A Wallet that renders a type dynamically without knowing its rulebook can do none of these.

## Goals

- Every Wallet check is satisfiable from what the Wallet holds: the rulebooks it implements, the signed metadata, and the request.
- The Wallet runs a rulebook check only for rulebooks it implements. Otherwise it relies on the metadata.
- Rulebook conformance is guaranteed end to end by role obligations:
  - the issuer projects the rulebook into metadata, including required risk profiles, signals and encryption;
  - the RP builds the payload per the rulebook;
  - the Authorizing Party verifies against the rulebook.
- Ad-hoc types need no rulebook. The immutability rule doesn't apply to them.
- The decision path between ad-hoc metadata, signed metadata and static rendering is stated once, informatively.

## Non-goals

- **Making metadata optional for hard-coded types.** We considered this and dropped it. The metadata entry declares which credential supports which type, provides the fallback for Wallets without the rulebook, and carries per-issuer settings. Metadata stays mandatory for every type.
- **Machine-readable or resolvable rulebooks.**
- **Ad-hoc metadata overriding a published type's risk configuration** (review #9). This is handled separately, next.

## Approaches considered

- **Chosen:** Wallet rulebook checks depend on whether the Wallet implements the rulebook. Otherwise it relies on metadata alone. The Authorizing Party always checks the rulebook, and the issuer and RP carry construction duties.
- **Rejected: rulebook checks only at the Authorizing Party.** This drops checks that a Wallet implementing the rulebook can and should run, and it places no duty on the issuer to project the rulebook into metadata.
- **Rejected: machine-readable, resolvable rulebooks.** Wallets hard-code rulebooks, so this solves a problem they don't have. It would also need a new resolution mechanism, because `urn:paso` URNs aren't resolvable.

## Decision path (per entry and credential)

```text
1. Entry carries ad-hoc `metadata`?
   ├─ yes → verify it (Metadata §5.3)
   │        ├─ invalid → entry incompatible (no fallback to stored metadata)
   │        └─ valid   → ad-hoc metadata is the whole definition; no rulebook check
   │                     → dynamic rendering only (View §5.1 cond. 3)
   └─ no  → 2
2. Type listed in the credential's signed metadata?
   ├─ no  → not supported → entry incompatible
   └─ yes → payload conforms to the metadata,
            and to the rulebook if the Wallet implements it → 3
3. Static rendering possible (Static Presentation section + Wallet implements exact type and version)?
   ├─ yes → Wallet MAY render static (security_hint locale failure → dynamic)
   └─ no  → dynamic from the metadata
```

## Changes

1. **`paso-core.md` §5.1**
   - Every type identifier **SHALL** have a Transaction Data Type Rulebook published by the identifier's owner, *except* types used only with ad-hoc metadata (Metadata §5).
   - For such types, the ad-hoc metadata is the complete definition, set by the Relying Party, and the immutability rule of §5.3 doesn't apply.
2. **`paso-core.md` new §5.5 "Rulebook Obligations"** (after the existing §5.4 "Content Quality")
   - The Attestation Provider **SHALL** publish transaction data type metadata consistent with the rulebook. This includes the claims and required fields, and the risk signal profiles, signals and encryption the rulebook requires, so that a Wallet relying on metadata alone collects what the rulebook requires.
   - The Relying Party **SHALL** construct the `payload` per the rulebook, and per its ad-hoc metadata for ad-hoc types.
   - The Authorizing Party **SHALL** verify conformance to the rulebook, per Verify §3 step 5.
   - Wallets implement rulebooks by building them in. A Wallet applies rulebook-specific checks only for rulebooks it implements. Otherwise it relies on the metadata.
3. **`paso-core.md` §7.5 condition 3**
   - The clause "does not contain fields not declared by the rulebook" applies only where the Wallet implements the rulebook.
   - All other clauses, including the claim `path` check, stay unconditional.
4. **`paso-core.md` §7.5, after the conditions:** add the decision path above as an informative paragraph or short list.
5. **`paso-proof-risk-signals.md`**
   - §4.1 step 1, second source, and step 3, rulebook enumerations: these apply where the Wallet implements the rulebook.
   - §7.2 item 1: the rulebook mandate applies where the Wallet implements the rulebook.
   - A note points to the Attestation Provider's obligation (Core §5.5) as what guarantees the outcome for Wallets that rely on metadata.
   - The Authorizing Party's resolution in Verify §3 step 6 is unchanged; it always uses the rulebook.
6. **`paso-view.md`:** no change. §5.2 already requires conformance to both the rulebook and the metadata in static mode, and static mode implies the Wallet implements the rulebook.
6a. **`paso-proof-verify.md` §3 step 5** (found while planning): the step checks the payload against "the applicable Transaction Data Type Rulebook", which an ad-hoc-only type lacks. For such a type, the Authorizing Party verifies the payload against the entry's ad-hoc `metadata` instead.
7. **`index.md` §6.2**
   - Reword the ad-hoc bullet. Ad-hoc metadata serves the RP's own types, which have no rulebook, and is their complete definition.
   - Replace "the issuer publishing its metadata and rulebook" with wording consistent with Core §5.1.
8. **`2026-11-24-spec-review.md`:** mark #4 resolved, set "Next up" to #9.

## Calls made (correct if wrong)

- **Ad-hoc metadata for a type that does have a rulebook** (an override of a published type) follows decision path step 1. The Wallet checks against the ad-hoc metadata only. The Authorizing Party still checks the rulebook. Whether such overrides should be allowed or constrained belongs to #9.
- **The new section is §5.5**, appended after the existing §5.4 "Content Quality". No renumbering.
- **Metadata §3 is unchanged.** Its rulebook references concern semantics and the definition of value types, not Wallet checks.