# PaSO: At Most One PaSO Credential per Presentation — Design

Date: 2026-11-25 · Branch: `draft-3` · Size: small change · Origin: spec review finding #12 (`2026-11-24-spec-review.md`)

## Intent

The advanced profile (Core §7.4.1) builds requests from independent slots and does not limit how many slots hold PaSO credentials. Everything downstream assumes there is only one:
- Core §7.4.2 talks about "the selected credential".
- View §4 allows one locale per consent screen.
- View §5.2 reports one `render_mode`.

Nobody has defined how two PaSO credentials would be consented to together (one screen or two, one locale or two). The user has no case that needs it. **Decision (user): a presentation carries at most one PaSO Credential.**

This also settles two smaller points:
- `∅` only matters for non-PaSO slots.
- The #11 deferred minor goes away: with one PaSO presentation, no entry can be matched by two presentations, so OID4VP §5.1's "only one of the referenced Credentials" holds.

## Goals

- Every request lets the user present exactly one PaSO Credential. The Wallet enforces this, and the Authorizing Party checks it.
- The DCQL routes to more than one PaSO credential are closed:
  - a second PaSO slot;
  - an optional PaSO slot or credential set;
  - several PaSO queries without `credential_sets`;
  - `multiple: true`.
- `∅` is defined in DCQL terms.
- View §5.2 describes `render_mode` per candidate credential, in both profiles. This resolves the deferred minor that limited it to the advanced profile.

## Non-goals

- **Several PaSO credentials in one approval** (two signatories, two accounts). If needed later, this is a new feature with its own screen and consent rules.
- **Changing transposability** for non-PaSO slots.

## Approaches considered

- **Chosen: at most one PaSO slot,** the user's pick. Existing single-screen and single-locale rules hold as written.
- **Rejected: several PaSO slots.** This needs new rules for screens, locale, consent order and one credential per entry, for a case nobody has.

## Changes

1. **`paso-core.md`**
   - **§7.3 (simple profile):** add to the conditions that the referenced credential query **SHALL NOT** set `multiple` to `true` ([OID4VP] Section 6.1). A request breaking this is not in the simple profile, so it falls to §7.4, where it is rejected.
   - **§7.4.1**, new paragraph after the "same credential set" rule. A presentation request **SHALL** allow exactly one PaSO Credential to be presented:
     - When `credential_sets` are used, every alternative of the credential set containing the PaSO-referenced credential query identifiers **SHALL** contain exactly one of them. That set **SHALL NOT** have `required` set to `false` ([OID4VP] Section 6.2).
     - When `credential_sets` are not used, the PaSO-targeted entries **SHALL** reference exactly one credential query identifier.
     - No PaSO-referenced credential query **SHALL** set `multiple` to `true`.
     - A Wallet that detects a violation **SHALL** stop processing and inform the user.
     - The slot these identifiers form is the **PaSO slot**.
   - **§7.4.1 "Concretely" paragraph:** add that a slot contains `∅` when some alternatives contain none of its credential query identifiers. By the rule above, the PaSO slot never contains `∅`.
   - **§7.4.2 first sentence:** the user selects exactly one PaSO Credential, from the PaSO slot, and exactly one entry applies to it.
   - **A.5:** name _S₁_ as the PaSO slot.
2. **`paso-view.md` §5.2:** the mode applies to the entry presented with the selected PaSO Credential and **MAY** differ between the candidate credentials the user can choose from. Drop "In the advanced profile".
3. **`paso-proof-verify.md` §3 intro:** steps 2–6 apply to *the* PaSO presentation. If the `vp_token` contains none, or more than one, the check fails (Core §7.4.1).
4. **`2026-11-24-spec-review.md`:**
   - Mark #12 resolved and set "Next up" to #13.
   - Remove the two deferred minors this resolves: the View §5.2 one and the #11 one.

## Calls made (correct if wrong)

- **The PaSO slot is mandatory** (no `∅`, set not optional). A request with transaction data must end with one PaSO presentation carrying it. Otherwise the transaction data would be signed by nobody.
- **"Exactly one per alternative" is the testable form** of "one PaSO slot without `∅`". The Wallet can check it directly on the options.
- **`multiple` is closed in both profiles.** Without that, a simple-profile request could still return several PaSO credentials.
- **Verify keeps the step 4 matching from #11 unchanged.** It now runs once.