# PaSO: Ad-hoc Metadata Only for Unpublished Types — Design

Date: 2026-11-25 · Branch: `draft-3` · Size: small change · Origin: spec review finding #9 (`2026-11-24-spec-review.md`)

## Intent

Banks use ad-hoc metadata for transaction data types they do not publish, such as their own login or limit-change interactions. Ad-hoc metadata is not a way to override a published type.

Today the specs allow such an override:
- Metadata §5.4 says ad-hoc metadata is used "in place of the corresponding `transaction_data_types` entry".
- Metadata §3 says it "takes precedence", and the §5 intro says "instead of relying solely on the corresponding entry".
- Risk §4.1, last paragraph, takes `risk_signal_profiles`, `risk_signals` and `encrypted` from the ad-hoc `metadata` object "instead" of the signed entry.

So an authorised Relying Party can drop signals the issuer marked as required, loosen `max_age`, or switch off encryption for a published type. If the authorised RP is a third party, that undoes the protection that encryption is meant to give against Relying Parties (Risk §7.1).

## Goals

- Ad-hoc metadata is valid only for a type absent from the targeted credential's signed `transaction_data_types`.
- The Wallet enforces this. The Authorizing Party checks it too.
- The override wording disappears. Ad-hoc metadata is the type's only metadata, not a replacement.

## Non-goals

- **A ratchet** that lets ad-hoc risk members only tighten a published configuration. The case it serves is not expected.
- **Changing ad-hoc metadata for unpublished types.** It keeps carrying its own risk members, and the rulebook sources apply as decided in #4.
- **Which signed JWT `metadata_integrity` identifies** (review #5).

## Approaches considered

- **Chosen:** ad-hoc metadata only for unpublished types, enforced by the Wallet and checked by the Authorizing Party.
- **Rejected: ratchet.** Signed risk configuration becomes a floor, with ad-hoc members applied on top. This adds machinery for a case nobody expects.
- **Rejected: keep replacement and document it as intended.** This leaves the weakening open whenever an issuer authorises a third party.

## Changes

1. **`paso-proof-metadata.md`**
   - **§3:** the signed JWT is the authoritative source. For a type it does not list, ad-hoc metadata serves as that transaction's metadata. Remove "takes precedence".
   - **§5 intro:** ad-hoc metadata may be supplied for a type the signed JWT does not list. Remove "instead of relying solely on the corresponding entry".
   - **§5.1:** the RP **SHALL NOT** include `metadata` in an entry whose `type` is listed in the signed `transaction_data_types` of any targeted credential.
   - **§5.3:** new step 5, which verifies that the `type` is not listed in that JWT's `transaction_data_types`. A failure follows the existing rule: invalid, incompatible, no fallback.
   - **§5.4:** retitle it "Processing". Ad-hoc metadata is used as the type's metadata for the transaction, and the "in place of" and "even if it is absent" wording goes.
   - **A.5 intro:** one sentence saying that, because this JWT publishes `urn:paso:sca:global:payment:1`, its authorised RPs may supply ad-hoc metadata only for other types.
2. **`paso-proof-risk-signals.md` §4.1, last paragraph:** the type is unpublished, so the risk members come from the `metadata` object. Remove "instead". The rulebook sources apply as for any entry, and the key still comes from the signed JWT (§7.3).
3. **`paso-proof-verify.md` §3 step 4, ad-hoc bullet:** the Authorizing Party also verifies that the entry's `type` is not listed in `transaction_data_types` of the JWT identified by `metadata_integrity`.
4. **`paso-core.md` §5.5, Relying Party bullet** (found while planning): an RP that supplies ad-hoc metadata for a type that has a rulebook **SHALL** keep that metadata consistent with the rulebook, as the Attestation Provider must for published metadata. This closes the gap in the review's "Input for #9" note, where ad-hoc risk members could omit rulebook-required profiles for a Wallet that doesn't implement the rulebook.
5. **`2026-11-24-spec-review.md`:** mark #9 resolved, remove the "Input for #9" line, and set "Next up" to #10.

## Calls made (correct if wrong)

- **A.4 is unchanged.** It points to A.7, which publishes no types, so it already conforms. A bank may also use a global type such as payment ad hoc, provided it doesn't publish that type.
- **The check is per targeted credential**, like every other §5.3 check. An entry targeting two credentials, only one of which publishes the type, is incompatible only with that one.
- **If an issuer starts publishing a type its own RP still sends ad hoc**, Wallets holding the new JWT reject those requests. The issuer controls both sides and coordinates the switch.
- **The RP carries the issuer's consistency duty for ad-hoc metadata** (change 4). The RP is then the party writing the metadata.
- **The §5.4 heading changes.** Its section number doesn't, so references stay valid.
