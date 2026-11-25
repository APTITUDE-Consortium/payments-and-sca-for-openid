# Changelog

This page lists the changes between published drafts of PaSO. For each draft, it first tells each role what to change in an implementation of the previous draft, then lists the changes document by document.

Every item carries one tag:

- **Breaking**: an implementation of the role that conformed to the previous draft no longer conforms.
- **New**: an optional or additive capability.
- **Clarified**: a resolved ambiguity or restatement; the intended behaviour is unchanged.

Section numbers refer to the current draft.

## draft-3 (changes since draft-2)

Draft-3 is compared with the published draft-2. Changes made and then superseded during the work on draft-3 are not listed; each item describes the draft-3 text.

### Changes by document

#### Introduction

- **Clarified** The overview presents two rendering modes: dynamic rendering, which every Wallet supports, and static rendering as an optional optimisation for standardised types ([Introduction §6](index.md)).
- **Clarified** Strong Customer Authentication is attributed to holder binding, not to the `amr` claim ([Introduction §4.1, §7 and §9](index.md)).
- **Clarified** Generic transaction types, such as login or limit changes, are served by ad-hoc metadata instead of a generic rulebook ([Introduction §6.2, §6.3](index.md)).
- **Clarified** The proof package hand-off uses a proposed endpoint with a signed, optionally encrypted envelope, and a payment scheme may define its own ([Introduction §4.2 and §7.2](index.md)).

#### PaSO Core

- **Breaking** New required SCA response claim `render_mode` (`dynamic` or `static`), also as an mdoc data element ([Core §6.1, §6.3](specifications/paso-core.md)).
- **Breaking** `display_locale` reports the `locale` tag of the rendered metadata entries, or the string `default` when the default entries were rendered. In static rendering it is a language tag and never `default` ([Core §6.1](specifications/paso-core.md)).
- **Breaking** A presentation carries exactly one PaSO Credential. The credential query identifiers referenced by PaSO-targeted entries form a single slot, the PaSO slot. Every alternative of its credential set contains exactly one of them, and that set is not optional. Without `credential_sets`, the PaSO entries reference exactly one credential query. No such query sets `multiple` to `true`. A Wallet rejects a request that breaks these rules ([Core §7.3, §7.4.1](specifications/paso-core.md)).
- **Breaking** Failures have one of three consequences: rejecting the request, excluding the credential, or making the entry not compatible with the credential. A locale-selection failure and a missing encryption key are now entry-level, so the Wallet falls back to the next entry instead of excluding the credential ([Core §7.5](specifications/paso-core.md)).
- **New** A Transaction Data Type Rulebook may include a Static Presentation section, which enables static rendering. It is part of the immutable semantic structure of the type ([Core §5.3](specifications/paso-core.md)).
- **New** A type used only with ad-hoc metadata needs no rulebook ([Core §5.1](specifications/paso-core.md)).
- **New** In the simple profile, several credentials may match the credential query; the user selects one, and the display follows the selection. The simple profile's boundary is stated exactly, and every other PaSO request is in the advanced profile ([Core §7.3, §7.4](specifications/paso-core.md)).
- **Clarified** Strong Customer Authentication is established by holder binding as required by the Credential Rulebook. `amr` is an ordinary risk signal: its presence does not establish SCA and its absence does not negate it ([Core §4.2, §6.1](specifications/paso-core.md)).
- **Clarified** `metadata_integrity` is always present. Where ad-hoc metadata is used, it identifies the signed credential metadata JWT that authorised the Relying Party ([Core §6.1](specifications/paso-core.md)).
- **Clarified** `transaction_data_hash` is computed over the base64url string of the entry exactly as received, without decoding. `transaction_data_hash_alg` is `sha-256` unless the rulebook names another algorithm. These claims are PaSO's representation of transaction data under OpenID4VP §8.4; PaSO does not use `transaction_data_hashes` ([Core §6.1](specifications/paso-core.md)).
- **Clarified** Rulebook obligations are stated by role. A Wallet applies the rulebooks it has built in and otherwise relies on the signed credential metadata, which the Attestation Provider keeps consistent with the rulebook ([Core §5.5](specifications/paso-core.md)).
- **Clarified** The Wallet renders one consent screen from a single locale or entirely from default entries ([Core §7.2](specifications/paso-core.md)).
- **Clarified** Entry compatibility is defined once for both profiles, including when a `payload` conforms ([Core §7.5](specifications/paso-core.md)).

#### PaSO View

- **Breaking** Labels are plain text. The `display_type` parameter and the value types `mini_markdown` and `template:*` are removed ([View §2, §3](specifications/paso-view.md)).
- **Breaking** A `transaction_data` entry may contain at most 10 displayed claim values; otherwise it is not compatible. This replaces the Wallet-defined bound of at least 200 rendered items ([View §2](specifications/paso-view.md)).
- **Breaking** Images must be PNG or JPEG. SVG is no longer supported, and the Wallet sends `Accept: image/png, image/jpeg` ([View §3](specifications/paso-view.md)).
- **Breaking** Locale selection is redefined. The available tags are the locales present in every considered array. The Wallet applies RFC 4647 Lookup for each locale of its priority list, then falls back to the default entries; if neither succeeds, the entry is not compatible ([View §4](specifications/paso-view.md)).
- **Breaking** Static rendering replaces the draft-2 permission for a dedicated UI. The Wallet may render statically only if the rulebook has a Static Presentation section, the Wallet implements that exact type and version, and the entry carries no ad-hoc metadata. The Wallet chooses the mode; Attestation Providers and Relying Parties cannot require or prohibit it. A static screen uses a single language and shows any `security_hint` exactly ([View §5](specifications/paso-view.md)).
- **Clarified** View applies to both the simple and the advanced profile and no longer requires the advanced profile ([View §1.1](specifications/paso-view.md)).
- **Clarified** The rendering mode may differ between the candidate credentials the user can choose from ([View §5.2](specifications/paso-view.md)).
- **Clarified** Security Considerations move to §6 (new §6.5 on the claim-value limit), References to §7, and Annex A.1 adds locale-selection examples ([View](specifications/paso-view.md)).

#### Metadata Module

- **Breaking** The issuer-signed ad-hoc metadata JWT (`adhoc-transaction-metadata+jwt`) is removed. Ad-hoc metadata is now a plain `metadata` object in the `transaction_data` entry. Only a Relying Party listed in `adhoc_metadata_clients` may supply it, its authority rests on the signature of the Authorization Request, and it is allowed only for types the signed credential metadata does not list ([Metadata §5](specifications/proof/paso-proof-metadata.md)).
- **Breaking** `ui_labels` is required for every transaction data type ([Metadata §3, §3.2](specifications/proof/paso-proof-metadata.md)).
- **Breaking** All `display` and `ui_labels` arrays of a type carry the same set of locales, and either all or none have a default entry. An array has no duplicate locales and at most one default entry. The `locale` value `default` is reserved. At most 10 claims may have a `display` array ([Metadata §3.3](specifications/proof/paso-proof-metadata.md)).
- **New** `adhoc_metadata_clients` lists the Relying Parties authorised to supply ad-hoc metadata ([Metadata §5.2](specifications/proof/paso-proof-metadata.md)).
- **New** `transaction_data_types` may be empty or omit types. A type the Attestation Provider does not publish is reserved for the Relying Parties it authorises ([Metadata §3](specifications/proof/paso-proof-metadata.md)).
- **Clarified** If locale selection fails for ad-hoc metadata, the entry is not compatible ([Metadata §5.4](specifications/proof/paso-proof-metadata.md)).
- **Clarified** The Wallet may refuse issuance if locale selection fails for the returned metadata ([Metadata §4](specifications/proof/paso-proof-metadata.md)).
- **Clarified** Display metadata for SD-JWT VC credentials, previously in the SD-JWT VC and SVG module, is now here: integrity-verified Type Metadata may be used for display, in the priority order of OpenID4VCI §12.2.4 ([Metadata §9](specifications/proof/paso-proof-metadata.md)).

#### Verify Module

- **Breaking** The ingestion endpoint is a proposal; a payment scheme or rulebook may define another forwarding mechanism. The body is always a signed JWT (`typ` `paso-proof-package+jwt`, sender's chain in `x5c`), optionally nested in a JWE (`cty` `JWT`, baseline `ECDH-ES` with `P-256` and `A256GCM`). The plain `application/json` body is removed. The sender may be the Relying Party or a party forwarding on its behalf. `401` means the signature, `typ` or chain failed ([Verify §4](specifications/proof/paso-proof-verify.md)).
- **Breaking** The Authorizing Party checks `render_mode`, checks `display_locale` according to the rendering mode, always checks `metadata_integrity`, and verifies ad-hoc metadata: the client is authorised, the type is unpublished, and the object conforms. For types used only with ad-hoc metadata, it checks the `payload` against that metadata. The `amr` check is removed ([Verify §3](specifications/proof/paso-proof-verify.md)).
- **Breaking** The `vp_token` must contain exactly one PaSO presentation. The matched entry is the PaSO-targeted entry whose `credential_ids` contain the presentation's credential query and whose hash equals `transaction_data_hash`. The Authorizing Party does not require it to be the first-match entry. The hash algorithm must be `sha-256` or the one the rulebook names ([Verify §3](specifications/proof/paso-proof-verify.md)).

#### Risk Signals Module

- **Breaking** When verifying, the Authorizing Party always applies the risk signal profiles, enumerations and encryption requirements of the rulebook, whatever the Wallet implements ([Risk Signals §4.1, §7.2](specifications/proof/paso-proof-risk-signals.md)).
- **New** For a type supplied by ad-hoc metadata, the risk members come from the `metadata` object ([Risk Signals §4.1](specifications/proof/paso-proof-risk-signals.md)).
- **Clarified** A Wallet applies rulebook risk sources only where it implements the rulebook, and otherwise the signed credential metadata ([Risk Signals §4.1, §7.2](specifications/proof/paso-proof-risk-signals.md)).
- **Clarified** Without an integrity-verified encryption key, the entry is not compatible with the credential ([Risk Signals §7.3](specifications/proof/paso-proof-risk-signals.md)).
- **Clarified** The caution against combining `amr` with encryption (former §7.8) is removed ([Risk Signals §7](specifications/proof/paso-proof-risk-signals.md)).

#### Risk Signal Registry

- **Breaking** The `amr` signal no longer has to cover two categories of authentication elements in a PSD2 context. An Authorizing Party must not rely on it as evidence of SCA ([Registry](specifications/proof/paso-proof-risk-signal-registry.md)).

#### Log Module

- **New** Replay of a statically rendered presentation reproduces the static presentation of the Wallet version recorded in `wallet_instance_version` ([Log §5](specifications/proof/paso-proof-log.md)).
- **Clarified** Resolved resources no longer include SVG templates; they are the resources fetched for display, such as remote images ([Log §3](specifications/proof/paso-proof-log.md)).

#### Payment rulebook

- **New** Static Presentation section: `amount` and `payee.name` are shown on the same screen as the affirmative action, `payee.logo` may be shown, and the other claims are not shown. Example A.2 shows a static rendering. References move to §4 ([Payment §3](rulebooks/transaction_data/Payment.md)).

#### Default risk profile

- **Breaking** The profile includes `urn:paso:risk:global:amr:1`, so it lists eight required signals, each with a `max_age` of 600 seconds ([Default](rulebooks/risk_profiles/Default.md)).

#### Removed

- The Generic rulebook (`urn:paso:sca:global:generic:*`). Generic use cases use ad-hoc metadata.
- The Mandate rulebook (`urn:paso:sca:global:mandate:*`).
- The SD-JWT VC and SVG module. Its display-metadata rules moved to Metadata §9; SVG images are no longer supported.
- The value types `mini_markdown` and `template:*`, and the `display_type` parameter.
- The issuer-signed ad-hoc metadata JWT (`adhoc-transaction-metadata+jwt`).