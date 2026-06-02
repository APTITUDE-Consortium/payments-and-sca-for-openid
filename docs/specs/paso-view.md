---
title: PaSO View
description: Generic, metadata-driven rendering of transaction data — value types and locale selection.
---

# PaSO View

## Abstract

This document defines how Wallets render transaction data for user consent. It specifies the generic rendering procedure, the normative set of value types for formatting claim values and labels, the locale selection procedure, and the UI elements used during a transaction.

## 1 Introduction

### 1.1 Overview

[PaSO Proof Metadata] defines how credential metadata carries transaction data type definitions, including claims with `display` arrays and `value_type` hints. This document defines how the Wallet uses that metadata to render transaction data to the user.

The Wallet renders any transaction data type generically using the metadata alone — no transaction-type-specific logic is required. A Wallet that implements a specific Transaction Data Type Rulebook **MAY** provide a dedicated UI in place of the generic renderer, provided it is done in accordance with the respective rulebooks.

A Wallet implementing PaSO View **SHALL** support the advanced profile defined in [PaSO Core] Section 7.4. The advanced profile enables multiple transaction data entries, credential alternatives, and credential sets — all of which require generic rendering to present the correct transaction data as the user navigates credential choices.

### 1.2 Requirements Notation

The key words "**MUST**", "**MUST NOT**", "**REQUIRED**", "**SHALL**", "**SHALL NOT**", "**SHOULD**", "**SHOULD NOT**", "**RECOMMENDED**", "**MAY**", and "**OPTIONAL**" in this document are to be interpreted as described in [RFC2119] and [RFC8174] when, and only when, they are written in all capital letters.

## 2 Generic Rendering

The Wallet **SHALL** be able to render any transaction data type generically. All claims that have a `display` array **SHALL** be rendered as a sequence of labelled values. Claims without a `display` array **MUST** be internal values irrelevant to the user's consent; the Wallet **MAY** omit them from the consent screen or show them in a separate detailed view.

The display order **SHALL** be the order in which the claims appear in the `claims` array, not the order of fields in the `payload` object.

Each label **SHALL** be formatted according to the `display_type` of its locale-matched `display` entry if present, or as plain text otherwise. Each value **SHALL** be formatted according to its `value_type` as defined in Section 3.

The Wallet **SHALL** ensure that all claims with a `display` array have been displayed to the user before enabling the confirmation action.

Relying Parties and Attestation Providers **MUST NOT** use labels, payload values, or hints to obfuscate information relevant to the user's consent.

The Wallet **SHALL** populate the UI elements defined in [PaSO Proof Metadata] Section 3.2 with the localised labels from the credential metadata. When a `security_hint` is present, the Wallet **SHALL** display it exactly as provided.

When claims contain `null` (array wildcard) in their `path`, the Wallet **SHALL** render them using the following recursive rule. For a given set of claims at a given nesting level:

1. Render all claims whose remaining path contains no `null`, in declared order.
2. Group the remaining claims by their shared path prefix up to and including the first `null`. For each such group, in the order of its first declared claim, iterate over the array elements at the `null` position: for each element, apply this rule recursively to the group's claims with the `null` resolved to that element's index.

The Wallet **SHOULD** display the complete transaction data on a single screen. Where this is not feasible, the Wallet **MAY** use scrolling, collapsible sections, or detailed views, provided the user can review the content in its entirety and the Wallet ensures the content has been displayed in full before enabling the confirmation action.

## 3 Value Types

Each claim metadata object that has a `display` array **MAY** include a `value_type` parameter that indicates how the Wallet **SHALL** format the claim value for display. If `value_type` is omitted, the value is treated as plain text and **MUST** be a string. The `value_type` parameter **MUST NOT** be used on claims without a `display` array.

The Wallet **SHALL** support all value types defined below. A `transaction_data` entry whose displayable claims declare a `value_type` not supported by the Wallet, or whose `payload` values do not conform to the declared `value_type`, is not compatible and the Wallet **SHALL** exclude it.

Each object in a claim's `display` array **MAY** include a `display_type` parameter that takes a value from the `value_type` set defined below. The `display_type` governs how the Wallet **SHALL** format the `name` text of that `display` entry, applying the same rendering rules as the corresponding `value_type` but to the label instead of the claim value. If `display_type` is omitted, the label is treated as plain text. A `display` entry whose `display_type` is not supported by the Wallet **SHALL** be excluded from the locale selection matching procedure defined in Section 4.

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

The Wallet **SHALL** support at least PNG, JPEG, and SVG base64 formats for Data URLs. When resolving a URL, the Wallet **SHALL** send an `Accept` header listing the image media types it supports.

If the URL is not a Data URL, the `payload` **MUST** contain a sibling claim at the same path suffixed with `#integrity` containing a [W3C.SRI] hash of the image content. The Wallet **SHALL** resolve the URL and verify the content against the `#integrity` value. If the resolved image is an SVG, URL integrity verification within the SVG **SHALL** follow [PaSO Proof SD-JWT-VC and SVG] Section 3. If verification fails, the `transaction_data` entry is not compatible.

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
<td><code>mini_markdown</code></td>
<td markdown="1">

The value is a string containing text with inline formatting. The Wallet **MAY** render emphasis and strong emphasis as per [CommonMark] Section 6.2 (italic and bold) and `<u>` tags for underline as per [CommonMark] Section 6.6, or **MAY** render the value as plain text without formatting.

All other [CommonMark] constructs and raw HTML **MUST** be rendered as their literal string representation.

</td>
</tr>
<tr>
<td><code>url</code></td>
<td markdown="1">

The value is a string containing a navigatable URL. URLs serve an informational or illustrative purpose; the user is not required to view them to give informed consent.

The Wallet **SHALL** display it as a clearly identifiable link. The Wallet **SHALL** display the full URL to the user; it **MUST NOT** replace or obscure the URL with alternative text.

</td>
</tr>
<tr>
<td><code>template:${value_type}</code></td>
<td markdown="1">

A composable prefix that enables placeholder interpolation. The value is a string that **MAY** contain placeholders of the form `{<index>}`, where `<index>` is the zero-based position of a claim in the `claims` array for the transaction data type (e.g., `{2}` references the third claim).

The Wallet **SHALL** resolve each placeholder by:

1. Looking up the claim at the given index in the `claims` array — if the index is out of bounds, the placeholder **SHALL** be treated as literal text.
2. Looking up the corresponding value in the `transaction_data.payload` using the claim's `path` — if the claim is absent from the payload, the entire locale entry **SHALL** be discarded.
3. Formatting the resolved value according to the claim's `value_type`.
4. Inserting the formatted value into the string, replacing the placeholder.

If all locale entries for a given locale are discarded, the Wallet **SHALL** fall back to the next locale in its priority list per Section 4; if no entry survives for any locale, the `transaction_data` entry is not compatible.

After interpolation, the result **SHALL** be formatted according to the inner `value_type` specified after `template:` (e.g., `template:mini_markdown` applies `mini_markdown` formatting). If a referenced claim's formatting and the inner `value_type` conflict, the inner `value_type` takes precedence.

Placeholders **MUST** only reference claims whose `path` contains the same number or fewer `null` entries than the referencing claim's `path`; each `null` in the referenced claim's `path` is resolved to the same array index as the corresponding `null` in the referencing claim's `path`.

</td>
</tr>
</tbody>
</table>

## 4 Locale Selection

The Wallet **SHALL** maintain a locale priority list: an ordered sequence of [RFC5646] language tags representing the user's language preferences, in decreasing order of priority.

The Wallet **SHALL** select a locale for the transaction as follows. For each locale in the priority list, in order:

1. For every `display` array across all `claims` metadata and `ui_labels` entries for the matching transaction data type, apply the Lookup matching scheme defined in [RFC4647] Section 3.4, using the current locale as the language range and the `locale` values of that array's entries as the available tags. If the Lookup scheme finds no match, use the first entry without a `locale` field as the default; if no such entry exists, the result is no match for that array.

2. If every `display` array produces a match, the current locale is selected. The Wallet **SHALL** use the matched entries for rendering and **SHALL NOT** continue to the next locale.

3. If any `display` array produces no match, the Wallet **SHALL** discard all matches from the current locale and proceed to the next locale.

If no locale produces a complete match, the Wallet **SHALL** exclude the credential from further processing.

The selected locale **SHALL** be reported in the `display_locale` holder binding proof claim per [PaSO Core].

If the transaction data cannot be presented in the Wallet's current operating language, the Wallet **MAY** switch its entire user interface to another language the user understands for the duration of the PaSO presentation flow.

## 5 References

| Reference                      | Description                                                                                                                |
|--------------------------------|----------------------------------------------------------------------------------------------------------------------------|
| [PaSO Core]                    | [PaSO Core](paso-core.md)                                                                                                  |
| [PaSO Proof Metadata]          | [PaSO Proof: Metadata Module](proof/paso-proof-metadata.md)                                                                |
| [PaSO Proof SD-JWT-VC and SVG] | [PaSO Proof: SD-JWT-VC and SVG Module](proof/paso-proof-sd-jwt-vc-svg.md)                                                  |
| [OID4VCI]                      | [OpenID for Verifiable Credential Issuance 1.0](https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0.html) |
| [RFC2119]                      | [RFC 2119 — Key words for use in RFCs](https://www.rfc-editor.org/rfc/rfc2119.html)                                        |
| [RFC8174]                      | [RFC 8174 — Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words](https://www.rfc-editor.org/rfc/rfc8174.html)        |
| [RFC4647]                      | [RFC 4647 — Matching of Language Tags](https://www.rfc-editor.org/rfc/rfc4647.html)                                        |
| [RFC5646]                      | [RFC 5646 — Tags for Identifying Languages](https://www.rfc-editor.org/rfc/rfc5646.html)                                   |
| [RFC2397]                      | [RFC 2397 — The "data" URL scheme](https://www.rfc-editor.org/rfc/rfc2397.html)                                            |
| [W3C.SRI]                      | [Subresource Integrity](https://www.w3.org/TR/SRI/)                                                                        |
| [CommonMark]                   | [CommonMark Specification](https://spec.commonmark.org/)                                                                   |
| [ISO8601]                      | [ISO 8601 — Date and time format](https://www.iso.org/iso-8601-date-and-time-format.html)                                  |
| [ISO4217]                      | [ISO 4217 — Currency codes](https://www.iso.org/iso-4217-currency-codes.html)                                              |
