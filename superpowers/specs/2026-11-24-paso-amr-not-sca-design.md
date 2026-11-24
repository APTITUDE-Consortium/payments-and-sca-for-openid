# PaSO: `amr` Is a Risk Signal, Not the SCA Mechanism — Design

Date: 2026-11-24 · Branch: `draft-3` · Size: small change · Origin: spec review findings #1 and #2 (`2026-11-24-spec-review.md`)

## Intent

`urn:paso:risk:global:amr:1` is a risk signal like all the others. It is a self-asserted Wallet observation of how the user released the transaction. It neither establishes Strong Customer Authentication nor negates it.

SCA is a property of the authentication itself. The credential's key is held in secure hardware (possession) and released only after user authentication by PIN or biometric (knowledge or inherence). The requirements for this belong in the **Credential Rulebook**, which already lists "issuance requirements" among its contents (Core §4.2).

Several passages currently treat `amr` as the SCA mechanism. They contradict this view and each other. This change removes that link everywhere.

## Goals

- No passage states or implies that SCA depends on the `amr` signal being present, required, unencrypted, or covering two factor categories.
- Core says where SCA comes from: holder binding and user authentication, as required by the Credential Rulebook.
- `amr` is treated exactly like the other registry signals in the Default profile, in verification and in encryption.
- The intro (`index.md`) matches the normative specs.

## Non-goals

- **Changing the `amr` signal definition.** Its value format, the RFC 8176 values and the `bio_strong`/`bio_weak` definitions stay as plain value definitions.
- **New protocol mechanisms for SCA**, such as wallet or key attestation in the proof. These are out of scope.
- **Changing regulatory mappings beyond `amr`** in `index.md` §9.

## Anti-goals

- **Any wording that makes encrypting `amr` look like a loss of SCA.** That is exactly the confusion being removed.

## Approaches considered

- **Chosen: `amr` is an ordinary signal; SCA comes from holder binding, governed by the Credential Rulebook.** This matches how SCA actually arises in a wallet. It also dissolves finding #2: encrypting `amr` is no different from encrypting any other signal.
- **Rejected: make `amr` mandatory for payments.** This would treat a self-asserted report as SCA evidence. It would also force a resolution of the clash with the Default profile's encryption.

## Changes

1. **`docs/specifications/paso-core.md`**
   - **§4.2:** add holder binding and user authentication requirements to the list of Credential Rulebook contents. State that a Credential Rulebook for a PaSO Credential used for SCA **SHALL** specify them.
   - **§6.1, closing paragraph:** replace "evidences SCA only where the profile requires the authentication-methods signal" with:
     - SCA is established by holder binding per the Credential Rulebook (§4.2);
     - the `amr` risk signal, when present, is an observation that neither establishes nor negates it.
2. **`docs/specifications/proof/paso-proof-risk-signal-registry.md` §2.8**
   - Remove the "in a PSD2 context, SHALL cover two categories" requirement.
   - Remove the final paragraph ("An ecosystem that requires SCA SHALL publish a profile…").
   - Remove the now-unused `[PSD2]` reference.
3. **`docs/specifications/proof/paso-proof-risk-signals.md`**
   - Delete §7.8 ("Interaction with Authentication-Method Signals").
   - Neutralise the `amr` remarks in Annex A.5 and the last paragraph of A.7.
4. **`docs/specifications/proof/paso-proof-verify.md` §3 step 6**
   - Remove the `amr` bullet.
   - Remove the sentence saying a non-issuer Authorizing Party "cannot perform the `amr` check" and its reference to §7.8.
5. **`docs/rulebooks/risk_profiles/Default.md`**
   - Add `urn:paso:risk:global:amr:1` (`required` `true`, `max_age` 600).
   - The profile now gathers every registry signal, so update the intro, `description`, the signal count (seven → eight) and the permissions note (`amr` needs no permission).
   - Remove the §7.8 sentence.
   - Keep the identifier `urn:paso:risk-profile:global:default:1`.
6. **`docs/index.md`**
   - §4.1: replace the "authentication methods … two factor categories" bullet with risk signals as optional Wallet observations.
   - Both flow diagrams: replace `amr` with "risk signals".
   - §9.1 and the §9.7 table: the factors come from the device-bound key released by user authentication, required by the Credential Rulebook. `amr` is not presented as SCA evidence.

## Calls made (correct if wrong)

- **The Credential Rulebook requirement is a SHALL for credentials used for SCA.** It stays a MAY for other credentials, matching the rest of the Core §4.2 list.
- **Default stays `:1`.** Your call: the spec is pre-release.
- **One commit per document.**

## Left to the builder

- The exact normative wording, matching the surrounding style.
- Checking that no other reference to Risk Signals §7.8 remains after its deletion.