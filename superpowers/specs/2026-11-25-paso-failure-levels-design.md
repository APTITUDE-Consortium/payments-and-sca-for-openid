# PaSO: Consistent Consequences of Processing Failures — Design

Date: 2026-11-25 · Branch: `draft-3` · Size: small change · Origin: spec review finding #13 (`2026-11-24-spec-review.md`)

## Intent

The same kind of failure has different consequences depending on which document describes it. Most entry-level failures (labels, value types, images, URLs, the claim-count limit) already make the entry "not compatible". Core's profile rules then decide what follows: fall back to the next entry, exclude the credential when none is left, or cease and inform the user. A few places break this:

- **View §4 step 3** excludes the *credential* when locale selection fails. This defeats the versioned fallback (Core A.7). View A.1 repeats it, and View §4 itself speaks of "exclude a credential".
- **Metadata §5.4** says the Wallet only *MAY* treat the entry as incompatible when ad-hoc locale selection fails. There is no real alternative, because View §4 forbids mixing locales.
- **Risk §7.3** makes the entry incompatible *and* says "cease processing it, and inform the user". That duplicates Core's fallback and contradicts it.
- **Core §7.2** summarises locale selection but omits the no-match, no-defaults case.

## Goals

- Core §7.5 states one model with three levels:
  - **Request:** the request is malformed or untrusted whatever the credential. The Wallet rejects it.
  - **Credential:** the credential itself is unusable. The Wallet excludes it.
  - **Entry:** every other failure makes the entry not compatible with that credential, and the profile rules decide what follows.
- The four outliers become entry-level and point to Core.

## Non-goals

- **Changing which failures exist,** or their conditions.
- **Rewording View's entry-level sentences** ("is not compatible and the Wallet SHALL exclude it"). They already mean entry-level.
- **The interplay with OID4VP §5.1's "return an error if … transaction data not conforming"** and versioned fallback. Not raised by the review; can be taken up separately.

## Approaches considered

- **Chosen: three levels, entry-level by default.** It keeps the versioned fallback working and matches what most of the text already says.
- **Rejected: fix each outlier locally, without a stated model.** New failure conditions would drift again.
- **Rejected: make duplicate member names entry-level too.** Ambiguous JSON in a request the RP signed indicates a bug or an attack, not an unsupported version. *(My call, stated in the conversation.)*

## Changes

1. **`paso-core.md`**
   - **§7.2:** add that if not every array has a default entry, the entry is not compatible with the credential (View §4).
   - **§7.5,** after "Other PaSO specifications define further conditions…": a paragraph with the three levels.
     - **Request:** an unsigned request (§3), an unsupported profile (§7.4), alternatives that are not transposable or don't form a single PaSO slot (§7.4.1), and duplicate member names.
     - **Credential:** an invalid signed credential metadata JWT (Metadata §7).
     - **Entry:** every other failure in any PaSO specification, followed by §7.3 step 2 or §7.4.2 steps 2–4.
2. **`paso-view.md`**
   - **§4 step 3:** the entry is not compatible with the credential (Core §7.5).
   - **§4, the "SHALL NOT exclude a credential" sentence:** becomes entry-level only.
   - **A.1, l.261:** "would exclude the credential" becomes "the entry would not be compatible with the credential".
3. **`paso-proof-metadata.md` §5.4:** locale selection applies to ad-hoc metadata like any metadata. If it fails, the entry is not compatible; if only defaults match, the entry **SHALL NOT** be treated as incompatible.
4. **`paso-proof-risk-signals.md` §7.3:** the entry is then not compatible with the credential (Core §7.5). Drop "cease processing it, and inform the user".
5. **`2026-11-24-spec-review.md`:** mark #13 resolved and set "Next up" to #14.

## Calls made (correct if wrong)

- **Duplicate member names stay request-level** (see Approaches).
- **The Request and Credential bullets summarise rules defined elsewhere,** with section references. Only the Entry bullet is a new rule: it is the default for everything not listed.
- **Metadata §7's "exclude the credential"** for an invalid metadata JWT is correct as credential-level, and stays.