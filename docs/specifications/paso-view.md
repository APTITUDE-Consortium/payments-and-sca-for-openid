# PaSO View

## Abstract

This document defines how Wallets render transaction data for user consent. It specifies the generic rendering procedure, the normative set of value types for formatting claim values and labels, the locale selection procedure, and the UI elements used during a transaction.

## 1 Introduction

### 1.1 Overview

[PaSO Proof Metadata] defines how credential metadata carries transaction data type definitions, including claims with `display` arrays and `value_type` hints. This document defines how the Wallet uses that metadata to render transaction data to the user.

This document defines two rendering modes. In **dynamic rendering**, the Wallet renders any transaction data type generically using the metadata alone — no transaction-type-specific logic is required. The Wallet **SHALL** be able to render every transaction data type with dynamic rendering. For transaction data types whose Transaction Data Type Rulebook contains a Static Presentation section, the Wallet **MAY** instead use **static rendering**, a purpose-built consent screen with Wallet-defined layout and labels, as defined in Section 5.

A Wallet implementing PaSO View **SHALL** support the advanced profile defined in [PaSO Core] Section 7.4. The advanced profile enables multiple transaction data entries, credential alternatives, and credential sets — all of which require generic rendering to present the correct transaction data as the user navigates credential choices.

### 1.2 Requirements Notation

The key words "**MUST**", "**MUST NOT**", "**REQUIRED**", "**SHALL**", "**SHALL NOT**", "**SHOULD**", "**SHOULD NOT**", "**RECOMMENDED**", "**MAY**", and "**OPTIONAL**" in this document are to be interpreted as described in [RFC2119] and [RFC8174] when, and only when, they are written in all capital letters.

## 2 Generic Rendering

This section defines dynamic rendering. Section 5.3 specifies which of its requirements also apply to static rendering.

The Wallet **SHALL** be able to render any transaction data type generically. All claims that have a `display` array **SHALL** be rendered as a sequence of labelled values. Claims without a `display` array **MUST** be internal values irrelevant to the user's consent; the Wallet **MAY** omit them from the consent screen or show them in a separate detailed view.

The display order **SHALL** be the order in which the claims appear in the `claims` array, not the order of fields in the `payload` object.

Each label **SHALL** be rendered as plain text. Each value **SHALL** be formatted according to its `value_type` as defined in Section 3.

The Wallet **SHALL** ensure that all claims with a `display` array, and all populated UI elements — including the `security_hint` where present — have been displayed to the user before enabling the confirmation action.

Relying Parties and Attestation Providers **MUST NOT** use labels, payload values, or hints to obfuscate information relevant to the user's consent.

The Wallet **SHALL** populate the UI elements defined in [PaSO Proof Metadata] Section 3.2 with the localised labels from the credential metadata. When a `security_hint` is present, the Wallet **SHALL** display it exactly as provided.

All labels are subject to the length limits and character constraints defined in [PaSO Proof Metadata] Section 3.3. The Wallet **SHALL** verify these constraints for every label it renders. If any label violates a constraint, the `transaction_data` entry is not compatible and the Wallet **SHALL** exclude it. The Wallet **MUST NOT** truncate, elide, or otherwise shorten a label; it **MAY** wrap a label across multiple lines provided the text remains visible in full. The Wallet **SHALL** likewise exclude a `transaction_data` entry whose formatted claim values contain the directional formatting characters prohibited by [PaSO Proof Metadata] Section 3.3.

The Wallet **SHALL** be capable of displaying any label that conforms to the maximum lengths of [PaSO Proof Metadata] Section 3.3 in full, in every display configuration the Wallet supports — including platform accessibility text scaling. For action labels this **MAY** include wrapping the label across multiple lines, enlarging the control, or reducing the font size within the limits of legibility; the Wallet **MUST NOT** rely on platform default controls that truncate or ellipsize overflowing text. If, despite this, a conforming label cannot be displayed in full in the active display configuration, the Wallet **SHALL NOT** proceed with a partially displayed label: the `transaction_data` entry **SHALL** be treated as not compatible, and if no compatible entry remains, the Wallet **SHALL** cease processing and inform the user of the reason.

When claims contain `null` (array wildcard) in their `path`, the Wallet **SHALL** render them using the following recursive rule. For a given set of claims at a given nesting level:

1. Render all claims whose remaining path contains no `null`, in declared order.
2. Group the remaining claims by their shared path prefix up to and including the first `null`. For each such group, in the order of its first declared claim, iterate over the array elements at the `null` position: for each element, apply this rule recursively to the group's claims with the `null` resolved to that element's index.

The Wallet **SHOULD** display the complete transaction data on a single screen. Where this is not feasible, the Wallet **MAY** use scrolling, collapsible sections, or detailed views, provided the user can review the content in its entirety and the Wallet ensures the content has been displayed in full before enabling the confirmation action.

A `transaction_data` entry **MUST NOT** contain more than 10 displayed claim values. Displayed claim values are the instances, present in the `payload`, of claims that have a `display` array, counted after array wildcard expansion. UI elements do not count toward this limit. The count is the same in dynamic and static rendering, even where static rendering omits a claim. The Wallet **SHALL** be able to render 10 displayed claim values. A `transaction_data` entry that exceeds this limit is not compatible and the Wallet **SHALL** exclude it.

## 3 Value Types

Each claim metadata object that has a `display` array **MAY** include a `value_type` parameter that indicates how the Wallet **SHALL** format the claim value for display. If `value_type` is omitted, the value is treated as plain text and **MUST** be a string. The `value_type` parameter **MUST NOT** be used on claims without a `display` array.

The Wallet **SHALL** support all value types defined below. A `transaction_data` entry whose displayable claims declare a `value_type` not supported by the Wallet, or whose `payload` values do not conform to the declared `value_type`, is not compatible and the Wallet **SHALL** exclude it.

Labels — the `name` of a claim's `display` entry and the `value` of a `ui_labels` entry — are plain text. Value types apply to claim values only and **MUST NOT** be applied to labels.

<table>
<thead>
<tr><th><code>value_type</code></th><th>Description</th></tr>
</thead>
<tbody>
<tr>
<td><code>boolean</code></td>
<td>The value is a JSON boolean (<code>true</code> or <code>false</code>). The Wallet <b>SHALL</b> display it as a localised human-readable string or a clear and unmistakable graphical representation.</td>
</tr>
<tr>
<td><code>frequency</code></td>
<td markdown="1">

The value is one of the following frequency codes: `INDA` (intraday), `DAIL` (daily), `WEEK` (weekly), `TOWK` (every two weeks), `TWMN` (twice a month), `MNTH` (monthly), `TOMN` (every two months), `QUTR` (quarterly), `FOMN` (every four months), `SEMI` (twice a year), `YEAR` (yearly), `TYEA` (every two years).

The Wallet **SHALL** display it as a human-readable, localised string that accurately and unmistakably represents the frequency.

</td>
</tr>
<tr>
<td><code>image</code></td>
<td markdown="1">

The value is a string containing a resolvable URL or a Data URL per [RFC2397] pointing to an image. Images serve an informational or illustrative purpose; the user is not required to view them to give informed consent.

The image **MUST** be in PNG or JPEG format; an image in any other format makes the `transaction_data` entry not compatible. When resolving a URL, the Wallet **SHALL** send an `Accept` header listing `image/png` and `image/jpeg`.

If the URL is not a Data URL, it **MUST** use the `https` scheme and the `payload` **MUST** contain a sibling claim at the same path suffixed with `#integrity` containing a [W3C.SRI] hash of the image content. The Wallet **SHALL** resolve the URL and verify the content against the `#integrity` value. When resolving, the Wallet **SHALL** enforce a fetch timeout, **SHALL** follow at most 3 redirects, and **SHALL NOT** transmit cookies, credentials, or Wallet-identifying headers. If verification fails, the `transaction_data` entry is not compatible.

An image — the Data URL payload or the resolved content — **MUST NOT** exceed 512 KiB in encoded size, and its decoded dimensions **MUST NOT** exceed 2048 pixels in either direction. A non-conforming image makes the `transaction_data` entry not compatible.

Because images are informational only, they **MUST NOT** convey information required for the user's consent. The Wallet **SHALL** render images contained within the consent layout; an image **SHALL NOT** overlay or displace other transaction data or Wallet controls. See Section 6.3 for the linkability considerations of resolving remote images.

</td>
</tr>
<tr>
<td><code>iso_date</code></td>
<td>The value is an [ISO8601] date string. The Wallet <b>SHALL</b> display it in a user-friendly localised date format that accurately and unmistakably represents the date.</td>
</tr>
<tr>
<td><code>iso_time</code></td>
<td>The value is an [ISO8601] time string. The Wallet <b>SHALL</b> display it in a user-friendly localised time format that accurately and unmistakably represents the time.</td>
</tr>
<tr>
<td><code>iso_date_time</code></td>
<td>The value is an [ISO8601] date-time string. The Wallet <b>SHALL</b> display it in a user-friendly localised date-time format that accurately and unmistakably represents the date and time.</td>
</tr>
<tr>
<td><code>iso_currency</code></td>
<td>The value is an [ISO4217] Alpha-3 currency code string. The Wallet <b>MAY</b> display it in a user-friendly format (e.g., the currency symbol or full name) that accurately and unmistakably identifies the currency.</td>
</tr>
<tr>
<td><code>iso_currency_amount</code></td>
<td markdown="1">

The value is a string consisting of a decimal number (integer part, decimal point, fractional digits per [ISO4217]) followed by a space and an [ISO4217] Alpha-3 currency code (e.g., `"49.99 EUR"`).

The Wallet **MAY** display it in a user-friendly localised format that accurately and unmistakably represents the amount and currency.

</td>
</tr>
<tr>
<td><code>label_only</code></td>
<td markdown="1">

The Wallet **SHALL** render only the `name` from the locale-matched `display` entry, without any associated value. This type is intended for contexts where no value is needed to convey the meaning, such as informational statements (e.g., "This is a recurring payment").

The claim **MUST NOT** be `mandatory`. The value in the `payload` **MAY** be of any JSON type.

</td>
</tr>
<tr>
<td><code>url</code></td>
<td markdown="1">

The value is a string containing a navigatable URL. URLs serve an informational or illustrative purpose; the user is not required to view them to give informed consent.

The URL **MUST** use the `https` scheme; otherwise the `transaction_data` entry is not compatible.

The Wallet **SHALL** display it as a clearly identifiable link. The Wallet **SHALL** display the full URL to the user; it **MUST NOT** replace or obscure the URL with alternative text. The Wallet **SHOULD** mitigate homograph confusion, e.g. by displaying an internationalised domain name in its punycode form when it contains confusable characters.

The Wallet **SHOULD NOT** make the URL navigable directly from the consent screen. If navigation is offered, it **SHALL** require an explicit user action clearly distinct from the consent actions, and the Wallet **SHOULD** indicate that the user is leaving the Wallet.

</td>
</tr>
</tbody>
</table>

## 4 Locale Selection

This section applies to dynamic rendering, and to static rendering where a `security_hint` is present (Section 5.4).

The Wallet **SHALL** maintain a locale priority list: an ordered sequence of [RFC5646] language tags representing the user's language preferences, in decreasing order of priority.

The Wallet **SHALL** render all `display` entries and `ui_labels` entries of a transaction either from a single locale or entirely from default entries (entries without a `locale`). It **SHALL NOT** combine entries of different locales, or locale-tagged and default entries, on one consent screen.

The arrays considered are the `display` arrays of all `claims` metadata objects that have one, together with all `ui_labels` entry arrays, for the matching transaction data type. The available tags are the `locale` values for which every considered array has an entry, compared case-insensitively.

The Wallet **SHALL** select the locale as follows:

1. For each locale in the priority list, in order, apply the Lookup matching scheme defined in [RFC4647] Section 3.4, using that locale as the language range and the available tags as the set of language tags to match against. On the first match, the matched tag is selected. The Wallet **SHALL** render every considered array from its entry with that tag and **SHALL NOT** continue.
2. If no locale in the priority list produced a match, and every considered array has a default entry, the default entries are selected. The Wallet **SHALL** render every considered array from its default entry.
3. Otherwise, the Wallet **SHALL** exclude the credential from further processing.

A locale-tagged match for any locale in the priority list takes precedence over the default entries. The Wallet **SHALL NOT** exclude a credential, or treat a `transaction_data` entry as not compatible, solely because the default entries were selected.

The Wallet **SHALL** report the selection in the `display_locale` holder binding proof claim per [PaSO Core]. The reported value is the selected tag as it appears in the metadata `locale` values, or the string `default` if the default entries were selected. It is not the priority-list locale used as the language range.

If the transaction data cannot be presented in the Wallet's current operating language, the Wallet **MAY** switch its entire user interface to another language the user understands for the duration of the PaSO presentation flow.

## 5 Static Rendering

### 5.1 Eligibility

The Wallet **MAY** render a `transaction_data` entry with static rendering only if all of the following hold:

1. The applicable Transaction Data Type Rulebook contains a Static Presentation section per [PaSO Core] Section 5.3.
2. The Wallet implements that rulebook for the exact transaction data type identifier of the entry, including its version.
3. The entry does not carry an ad-hoc `metadata` parameter per [PaSO Proof Metadata] Section 5.

Otherwise, the Wallet **SHALL** use dynamic rendering.

### 5.2 Mode Selection

The Wallet selects the rendering mode for each `transaction_data` entry it presents. Attestation Providers and Relying Parties cannot require or prohibit static rendering. In the advanced profile ([PaSO Core] Section 7.4), the mode applies to the entry presented for each credential and **MAY** differ between credentials. The Wallet **SHALL** report the mode used for the presented entry in the `render_mode` claim per [PaSO Core] Section 6.1.

Static rendering does not change how the credential metadata is obtained or which transaction data types a credential supports. The Wallet **SHALL** retrieve and verify the signed credential metadata per [PaSO Proof Metadata], and the `payload` **SHALL** conform both to the Transaction Data Type Rulebook and to the claims metadata of the matched transaction data type.

### 5.3 Presentation Obligations

In static rendering, the Wallet **SHALL** display the content that the Static Presentation section of the rulebook requires, in the manner it requires. The Wallet uses its own layout and its own localised labels in place of the `display` entries and `ui_labels` of the credential metadata, except for the `security_hint`. The Wallet's labels **SHALL** convey the meaning defined by the rulebook clearly and unmistakably.

The following requirements of Section 2 apply to static rendering unchanged: all content required for display **SHALL** have been displayed before the confirmation action is enabled; the Wallet **MUST NOT** truncate, elide, or otherwise shorten any label or displayed claim value; displayed claim values **SHALL** be formatted according to their `value_type` per Section 3; a `transaction_data` entry whose formatted claim values contain prohibited directional formatting characters **SHALL** be excluded; and the limit on displayed claim values applies.

When the matched transaction data type provides a `security_hint`, the Wallet **SHALL** display it exactly as provided, in the entry selected per Section 5.4.

### 5.4 Locale and `display_locale`

A statically rendered consent screen **SHALL** use a single language.

If the matched transaction data type provides a `security_hint`, the Wallet **SHALL** perform locale selection per Section 4. If that selects the default entries, or selects a tag in whose language the Wallet cannot render its static presentation, the Wallet **SHALL** use dynamic rendering instead. Otherwise, the Wallet **SHALL** render the static presentation in the language of the selected tag and **SHALL** report the selected tag in `display_locale`.

If no `security_hint` is provided, the Wallet **SHALL** report in `display_locale` the [RFC5646] language tag of the language in which it rendered the static presentation.

In static rendering, `display_locale` **SHALL NOT** be `default`.

## 6 Security Considerations

_**Note**: This section is **informative**._

### 6.1 Metadata as an Injection Channel

Everything the Wallet renders during consent originates outside the Wallet: labels and value types from the Attestation Provider's signed metadata, and — through value formatting — values from the Relying Party's `payload`. The constraints in this document and in [PaSO Proof Metadata] Section 3.3 (length limits, character prohibitions, text-only labels, resource limits, rendering caps) exist to keep this channel from being usable to obfuscate or forge consent content. Wallets should treat every metadata- or payload-supplied string strictly as display data — never as markup beyond the constructs explicitly permitted by the declared value type, and never as code or instructions.

### 6.2 Why Truncation Is Prohibited

Section 2 forbids truncating, eliding, or shortening labels. Attacker-influenced text truncates to attacker-chosen prefixes: a label crafted so that platform ellipsis cuts it after "Confirm payment of €1.00" hides the continuation. Divergent, implementation-defined truncation behaviour across Wallets would make such attacks reliable. Exclusion of the entire entry is therefore the only permitted failure mode for oversized content.

### 6.3 Linkability of Remote Resources

Resolving a remote image URL at consent time reveals the transaction timing and the Wallet's network address to the host serving the image. Attestation Providers and Relying Parties should prefer Data URLs for images. Wallets resolving remote images should be aware of this correlation channel; the considerations of [PaSO Proof Metadata] Section 8 on unlinkability apply in spirit, even though the fetch is triggered by the transaction itself.

### 6.4 Confusable Text and Wallet Chrome Spoofing

The character constraints prohibit directional embedding and override characters, but cannot prevent homoglyphs or text that mimics Wallet UI (e.g., a label reading "✓ Verified by your Wallet"). Wallets should render metadata-supplied content so that it is visually attributable as transaction content and cannot be mistaken for Wallet-generated UI or system dialogs — for example, through clear containment within the consent layout and consistent, Wallet-controlled styling of its own controls.

### 6.5 Why the Number of Displayed Claim Values Is Limited

A user can realistically review only a small number of values before confirming a transaction; a consent screen that lists more invites approval without review. Section 2 therefore fixes the limit at 10 displayed claim values for every Wallet rather than leaving it Wallet-defined: a single limit makes behaviour identical across Wallets, so a transaction cannot be presentable in one Wallet and rejected by another, and every Wallet can design its consent screen for a known maximum. A `transaction_data` entry over the limit is excluded rather than shortened, for the reasons given in Section 6.2.

## 7 References

| Reference                      | Description                                                                                                                |
|--------------------------------|----------------------------------------------------------------------------------------------------------------------------|
| [PaSO Core]                    | [PaSO Core](paso-core.md)                                                                                                  |
| [PaSO Proof Metadata]          | [PaSO Proof: Metadata Module](proof/paso-proof-metadata.md)                                                                |
| [OID4VCI]                      | [OpenID for Verifiable Credential Issuance 1.0](https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0.html) |
| [RFC2119]                      | [RFC 2119 — Key words for use in RFCs](https://www.rfc-editor.org/rfc/rfc2119.html)                                        |
| [RFC8174]                      | [RFC 8174 — Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words](https://www.rfc-editor.org/rfc/rfc8174.html)        |
| [RFC4647]                      | [RFC 4647 — Matching of Language Tags](https://www.rfc-editor.org/rfc/rfc4647.html)                                        |
| [RFC5646]                      | [RFC 5646 — Tags for Identifying Languages](https://www.rfc-editor.org/rfc/rfc5646.html)                                   |
| [RFC2397]                      | [RFC 2397 — The "data" URL scheme](https://www.rfc-editor.org/rfc/rfc2397.html)                                            |
| [W3C.SRI]                      | [Subresource Integrity](https://www.w3.org/TR/SRI/)                                                                        |
| [ISO8601]                      | [ISO 8601 — Date and time format](https://www.iso.org/iso-8601-date-and-time-format.html)                                  |
| [ISO4217]                      | [ISO 4217 — Currency codes](https://www.iso.org/iso-4217-currency-codes.html)                                              |

## Annex A: Examples

_**Note**: This annex is **informative**._

### A.1 Locale Selection

The following examples apply Section 4 to the transaction data type of [PaSO Proof Metadata] Annex A.6. Every array in that metadata carries entries for `en` and `de` and a default entry, so the available tags are `en` and `de`, and the default entries are available as a fallback.

| Wallet locale priority list | Lookup                                     | Entries rendered | `display_locale` |
|-----------------------------|--------------------------------------------|------------------|------------------|
| `de`, `en`                  | `de` matches `de`                          | `de`             | `de`             |
| `de-CH`                     | `de-CH` truncates to `de`, which matches   | `de`             | `de`             |
| `fr`, `de`                  | `fr` no match; `de` matches                | `de`             | `de`             |
| `fr`                        | no match                                   | default          | `default`        |

In the third row, German is shown although the first preference, `fr`, is unavailable: a locale-tagged match anywhere in the priority list takes precedence over the default entries. In the fourth row, the user sees the issuer's fallback text, and the proof says so: `display_locale` is `default`, not `fr`.

If the same metadata carried no default entries, the fourth row would produce no selection, and the Wallet would exclude the credential.
