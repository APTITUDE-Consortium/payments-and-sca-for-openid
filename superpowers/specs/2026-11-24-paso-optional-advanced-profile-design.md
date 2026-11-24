# PaSO: The Advanced Profile Is Optional — Design

Date: 2026-11-24 · Branch: `draft-3` · Size: small change · Origin: spec review finding #3 (`2026-11-24-spec-review.md`)

## Intent

The advanced profile (Core §7.4) is optional. A Wallet can conform to PaSO, including PaSO View and dynamic rendering, by implementing only the simple profile.

Today the specs contradict each other:
- Core §7.4 says the Wallet **MAY** implement the advanced profile.
- View §1.1 makes it mandatory for every Wallet implementing View, and View is mandatory for every Wallet.
- The simple profile's boundary is also fuzzy. §7.3 says "**MAY** reject non-trivial credential sets", while §7.4 says "**SHALL** reject". "Non-trivial" is undefined.

## Goals

- View no longer requires the advanced profile.
- The simple profile has an exact boundary. A Wallet without the advanced profile **SHALL** reject every request outside it.
- The simple profile is self-contained. The compatibility rules it needs are no longer buried in the advanced profile's steps.
- In the simple profile, a user with several credentials matching the one credential query can pick one. The consent screen uses the chosen credential's metadata and updates when the user switches.

## Non-goals

- **Changing advanced-profile semantics:** transposability, slots and first-match all stay.
- **Resolving the exclusion-granularity inconsistencies** (review #13), or the slot-vs-single-selection question (review #12).

## Approaches considered

- **Chosen: a shared §7.5 "Entry Compatibility", referenced by both profiles; a precise simple-profile boundary; View made profile-neutral.** No section is renumbered, so external references keep working.
- **Rejected: duplicating the conformance rules in §7.3.** The two copies would drift apart.
- **Rejected: forbidding `credential_sets` in the simple profile.** This would reject harmless requests that simply add optional non-PaSO credentials.

## Changes

1. **`paso-core.md`**
   - **New §7.5 "Entry Compatibility".** It defines when a PaSO-targeted entry is compatible with a credential:
     - a credential query in `credential_ids` matches the credential;
     - the `type` is supported by the credential;
     - the `payload` conforms (definition moved from §7.4.2 step 2);
     - external resources are resolved and verified (rule moved from §7.4.2 step 3).
     The duplicate-member-names rejection moves with them, unchanged. §7.5 also notes that other PaSO specifications add further compatibility conditions.
   - **§7.3 simple profile.**
     - Boundary: exactly one PaSO-targeted entry, whose `credential_ids` names exactly one credential query. When `credential_sets` are present, that query appears in every option of every credential set that references it, and at least one such set is required. The "non-trivial" sentence goes.
     - Steps:
       1. Find the Wallet credentials that match the query.
       2. Keep those the entry is compatible with (§7.5). If none remain, cease and inform the user.
       3. If several remain, the user selects one. The Wallet displays the entry rendered from that credential's metadata, and updates the display when the selection changes.
       4. Display for consent; on consent, proceed.
   - **§7.4.**
     - The advanced profile applies to any request with a PaSO-targeted entry that is outside the simple profile.
     - A Wallet that does not support it **SHALL** reject such requests and inform the user. Replace the current "non-trivial" wording.
     - §7.4.2 steps 2 and 3 reference §7.5 instead of defining the rules inline. Keep the "resume with the next entry" fallback behaviour.
2. **`paso-view.md` §1.1.** Replace the advanced-profile **SHALL** with: View applies to both profiles; the advanced profile's selection-dependent display rules apply where the Wallet supports it.
3. **`proof/paso-proof-metadata.md` §5.3.** Point the "incompatible" reference to [PaSO Core] §7.5.
4. **`index.md` §5.** Mark the advanced profile as optional.

## Calls made (correct if wrong)

- Several matching credentials in the simple profile: the user picks, and the screen re-renders. (You answered "proceed".)
- §7.5 is placed after §7.4 to avoid renumbering.
- One commit per document.