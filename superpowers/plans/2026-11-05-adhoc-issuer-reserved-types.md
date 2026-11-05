# Issuer-Reserved Transaction Data Types Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an Attestation Provider leave transaction data types unpublished
(`transaction_data_types` may be `{}` or partial) and use them only through
ad-hoc metadata JWTs that are audience-bound (`aud`) to one Relying Party.

**Architecture:** These are specification text edits only. Changes 1–7 go in
the Metadata module, change 8 in Verify, and change 9 in Risk Signals. No
other modules change.

**Tech Stack:** Markdown, MkDocs (`make build` = `mkdocs build --strict`).

**Spec:** `superpowers/specs/2026-11-05-adhoc-only-issuers-design.md`

**Branch:** `feat/adhoc-issuer-reserved-types`, based on
`feat/no-locale-mixing` (PR #7). The PR targets `feat/no-locale-mixing`.

## Global Constraints

- Do not edit the lines PR #7 rewrote: Metadata line 134 (§4, last ¶),
  line 189 (§5.4 locale ¶), line 212 (§6); Verify line 46
  (`display_locale`); anything in `paso-view.md` and `paso-core.md`.
- Line numbers below refer to the files at commit `fec1cbf`. They shift
  as you insert text, so **anchor every edit on the quoted text**, not
  on the number.
- Normative keywords are bold, e.g. `**SHALL**`, per the existing style.
  Informative sentences use lowercase "should".
- Terminology: "Attestation Provider", "Relying Party", "Authorizing
  Party", "ad-hoc metadata JWT", as used in the files.
- The example `client_id` value is `x509_san_dns:bank.example` in every
  example.
- `make build` must exit 0 after every task.

## Review Focus

1. **`client_id` with a prefix scheme** (`x509_san_dns:bank.example` vs.
   `bank.example`). This is exact string comparison including the prefix.
   Pinned in Task 2 (the step text says "exact") and Task 3 (the example
   uses the prefixed form).
2. **`aud` as an array** (e.g. `["x509_san_dns:bank.example"]`). It must be
   rejected even though RFC7519 allows arrays. Pinned in Task 2 by the
   "single string … SHALL NOT" grep.
3. **Authorizing Party ≠ Relying Party** (the proof is forwarded via the
   ingestion endpoint). Verify must take the expected `aud` from the
   Authorization Request, not from the Authorizing Party's own identity.
   Pinned in Task 4.
4. **The bank overrides a published type ad hoc.** `aud` is still required,
   and `metadata_integrity` is omitted. Pinned in Task 2 (§5.4 bullet).
5. **Issuance with `transaction_data_types: {}`** under PR #7's locale
   rules. It must not be refused or blocked by §4 or §6. Pinned in Task 1
   ("treated as succeeding").

---

### Task 1: Allow empty/partial `transaction_data_types` (Metadata §3)

**Files:**
- Modify: `docs/specifications/proof/paso-proof-metadata.md` §3, after line 43

**Interfaces:**
- Produces: the term "unpublished" transaction data type, meaning one
  absent from the signed credential metadata. Task 2 §5.5 refers to it
  via "Section 3".

- [ ] **Step 1: Insert two paragraphs after the bullet ending "The Wallet **MUST** ignore any unrecognised parameters." (line 43), separated by blank lines, before the paragraph starting "A PaSO Credential **SHALL NOT** be accepted":**

```markdown
The `transaction_data_types` object **MAY** be empty and **MAY** omit transaction data types that the Attestation Provider uses. A transaction data type absent from the signed credential metadata is supported by the credential only for a `transaction_data` entry that carries a valid ad-hoc metadata JWT per Section 5; a `transaction_data` entry of such a type without a `metadata` parameter is not supported by the credential for the purposes of [PaSO Core] Section 7. Where `transaction_data_types` is empty, locale selection per [PaSO View] Section 4 for the credential metadata, as required in Sections 4 and 6, **SHALL** be treated as succeeding.

Transaction data types intended for use by third-party Relying Parties should be published in the signed credential metadata. Types the Attestation Provider does not publish are reserved for the Relying Parties to which it issues audience-bound ad-hoc metadata JWTs (Section 5.5).
```

- [ ] **Step 2: Verify**

Run: `grep -c 'object \*\*MAY\*\* be empty' docs/specifications/proof/paso-proof-metadata.md`. Expected: `1`.
Run: `grep -c '\*\*SHALL\*\* be treated as succeeding' docs/specifications/proof/paso-proof-metadata.md`. Expected: `1`.
Run: `make build`. Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add docs/specifications/proof/paso-proof-metadata.md
git commit -m "spec(metadata): allow empty or partial transaction_data_types"
```

---

### Task 2: Audience-bound ad-hoc metadata (Metadata §5, §9)

**Files:**
- Modify: `docs/specifications/proof/paso-proof-metadata.md` lines 159,
  160 (+insert), 178 (+insert), 187 (+insert), 206 (+append), 252 (+insert)

**Interfaces:**
- Produces: the claim `aud` (§5.2) and step 8 (§5.3). Task 3 examples
  carry `aud`. Task 4 Verify references "[PaSO Proof Metadata] Section 5.3".

- [ ] **Step 1: §5.2 `exp` bullet (line 159).** Replace `bounds how long Relying Parties can cache and reuse the JWT` with `bounds how long the Relying Party identified by \`aud\` can cache and reuse the JWT`.

- [ ] **Step 2: §5.2, insert a bullet directly after the `transaction_data_type` bullet (line 160):**

```markdown
  - `aud`: **REQUIRED**. The `client_id` per [OID4VP] of the single Relying Party permitted to use this JWT. The value **SHALL** be a single string; the array form permitted by [RFC7519] Section 4.1.3 **SHALL NOT** be used.
```

- [ ] **Step 3: §5.3, insert step 8 directly after step 7 (line 178):**

```markdown
8. Verify that the `aud` claim is a single string that exactly equals the `client_id` of the Authorization Request carrying the `transaction_data` entry, including any client identifier prefix.
```

- [ ] **Step 4: §5.4, append a third bullet after the bullet ending "even if it is absent from the signed credential metadata." (line 187):**

```markdown
- The signed credential metadata JWT is not used to display the transaction data; the `metadata_integrity` claim per [PaSO Core] **SHALL** therefore be omitted from the presentation.
```

- [ ] **Step 5: §5.5, append a paragraph at the end of the section (after the paragraph starting "The binding deliberately does not require the same key", line 206), before `## 6 Storage and Handling`:**

```markdown
The `aud` claim (Section 5.3 step 8) binds each ad-hoc metadata JWT to a single Relying Party. Because the JWT reaches the Wallet through the Relying Party, without this binding any Relying Party that obtained a copy could reuse it until `exp`. With it, a copied JWT is rejected at every other Relying Party, and a short `exp` limits reuse by the bound Relying Party itself. Together with Section 3, this lets an Attestation Provider reserve transaction data types: types it does not publish in the signed credential metadata are usable only by the Relying Parties for which it issues ad-hoc metadata JWTs. A typical case is a bank acting both as Attestation Provider and as Relying Party, which uses unpublished transaction data types for its own transactions while third-party Relying Parties use the published ones.
```

- [ ] **Step 6: §9 References, insert a row after `[RFC5646]` (line 252):**

```markdown
| [RFC7519]   | [RFC 7519 — JSON Web Token (JWT)](https://www.rfc-editor.org/rfc/rfc7519.html)                                             |
```

- [ ] **Step 7: Verify**

Run: `grep -c '^  - \`aud\`: \*\*REQUIRED\*\*' docs/specifications/proof/paso-proof-metadata.md`. Expected: `1`.
Run: `grep -c 'array form permitted by \[RFC7519\] Section 4.1.3 \*\*SHALL NOT\*\*' docs/specifications/proof/paso-proof-metadata.md`. Expected: `1`.
Run: `grep -c '^8\. Verify that the `aud` claim is a single string that exactly equals' docs/specifications/proof/paso-proof-metadata.md`. Expected: `1`.
Run: `grep -c '`metadata_integrity` claim per \[PaSO Core\] \*\*SHALL\*\* therefore be omitted' docs/specifications/proof/paso-proof-metadata.md`. Expected: `1`.
Run: `grep -c '^| \[RFC7519\]' docs/specifications/proof/paso-proof-metadata.md`. Expected: `1`.
Run: `make build`. Expected: exit 0.

- [ ] **Step 8: Commit**

```bash
git add docs/specifications/proof/paso-proof-metadata.md
git commit -m "spec(metadata): bind ad-hoc metadata JWTs to one Relying Party via aud"
```

---

### Task 3: Examples (Metadata Annex A.4, A.5, new A.7)

**Files:**
- Modify: `docs/specifications/proof/paso-proof-metadata.md` A.4 (line 355,
  line 382), A.5 (line 432), append A.7 at end of file

**Interfaces:**
- Consumes: `aud` (Task 2), empty `transaction_data_types` (Task 1).

- [ ] **Step 1: A.4 intro (line 355).** Replace `A decoded \`transaction_data\` entry carrying an ad-hoc metadata JWT (JWT abbreviated):` with `A decoded \`transaction_data\` entry carrying an ad-hoc metadata JWT (JWT abbreviated), in an Authorization Request whose \`client_id\` is \`x509_san_dns:bank.example\`:`.

- [ ] **Step 2: A.4 and A.5 payloads.** In both decoded payloads, insert `  "aud": "x509_san_dns:bank.example",` on the line directly after `  "transaction_data_type": "urn:paso:sca:global:payment:1",` (lines 382 and 432). A.5's sentence "Only `sub` and `format` differ from A.4" stays true and is not edited.

- [ ] **Step 3: Append A.7 at the end of the file (after A.6's closing fence), preceded by a blank line:**

````markdown
### A.7 Signed Credential Metadata JWT Payload without Published Transaction Data Types

A signed credential metadata JWT payload for an Attestation Provider that publishes no transaction data types (Section 3). Every PaSO transaction with this credential requires an ad-hoc metadata JWT bound via `aud` to the requesting Relying Party (Section 5). The JWT still carries the credential's `display` and the issuer's `risk_signals_encryption_keys`.

```json
{
  "iss": "https://issuer.bank.example",
  "sub": "https://bank.example/sca/card",
  "format": "dc+sd-jwt",
  "iat": 1710000000,
  "exp": 1710086400,
  "credential_metadata_uri": "https://issuer.bank.example/credential-metadata/BankPaymentCard",
  "credential_metadata": {
    "display": [
      { "name": "Bank Payment Card", "locale": "en" },
      { "name": "Bank Zahlungskarte", "locale": "de" }
    ],
    "transaction_data_types": {},
    "risk_signals_encryption_keys": {
      "keys": [
        {
          "kty": "EC",
          "crv": "P-256",
          "x": "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU",
          "y": "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0",
          "use": "enc",
          "kid": "issuer-enc-1",
          "alg": "ECDH-ES"
        }
      ]
    }
  }
}
```
````

- [ ] **Step 4: Verify**

Run: `grep -c '"aud": "x509_san_dns:bank.example"' docs/specifications/proof/paso-proof-metadata.md`. Expected: `2`.
Run: `grep -c '^### A.7 ' docs/specifications/proof/paso-proof-metadata.md`. Expected: `1`.
Run: `python3 -I -c 'import re,json,sys; t=open(sys.argv[1]).read(); [json.loads(b) for b in re.findall(r"```json\n(.*?)\n```", t, re.S)]; print("json ok")' docs/specifications/proof/paso-proof-metadata.md`. Expected: `json ok`. If A.4's abbreviated JWT string makes a block invalid, the error names it; that block is pre-existing and may be skipped only if it already failed at `fec1cbf`.
Run: `make build`. Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add docs/specifications/proof/paso-proof-metadata.md
git commit -m "docs(metadata): add aud to ad-hoc examples, example with empty transaction_data_types"
```

---

### Task 4: Verify and Risk Signals use ad-hoc metadata when present

**Files:**
- Modify: `docs/specifications/proof/paso-proof-verify.md` step 4 (after line 47)
- Modify: `docs/specifications/proof/paso-proof-risk-signals.md` §4.1 (after line 133)

**Interfaces:**
- Consumes: "[PaSO Proof Metadata] Section 5.3" (now including step 8) and
  "Section 5.4". Both reference labels already exist in each file's
  References table.

- [ ] **Step 1: Verify, step 4.** After the `jti` bullet (line 47), insert a blank line, then this paragraph indented by 3 spaces so it stays inside list item 4. Do not touch the `display_locale` bullet.

```markdown
   Where this step refers to the credential metadata of the matched transaction data type and the `transaction_data` entry in the Authorization Request carries a `metadata` parameter, the Authorizing Party **SHALL** instead use the `metadata` object of that ad-hoc metadata JWT, after verifying the JWT per [PaSO Proof Metadata] Section 5.3 with the `client_id` of the Authorization Request as the expected `aud`.
```

- [ ] **Step 2: Risk Signals §4.1.** After the paragraph "Where neither source references a profile and neither enumerates a signal, the effective signal set is empty." (line 133), insert a blank line and:

```markdown
Where the `transaction_data` entry carries a valid ad-hoc metadata JWT per [PaSO Proof Metadata] Section 5, the `risk_signal_profiles`, `risk_signals`, and `encrypted` members that this section and Section 7.2 take from the signed credential metadata are taken from that JWT's `metadata` object instead, per [PaSO Proof Metadata] Section 5.4. The issuer encryption key is unaffected and is obtained per Section 7.3.
```

- [ ] **Step 3: Verify**

Run: `grep -c 'with the `client_id` of the Authorization Request as the expected `aud`' docs/specifications/proof/paso-proof-verify.md`. Expected: `1`.
Run: `git diff fec1cbf -- docs/specifications/proof/paso-proof-verify.md | grep -c '^-'`. Expected: `1` (the `---` header only; no removed lines).
Run: `grep -c 'are taken from that JWT.s `metadata` object instead' docs/specifications/proof/paso-proof-risk-signals.md`. Expected: `1`.
Run: `make build`. Expected: exit 0. Then open `site/specifications/proof/paso-proof-verify/index.html` and confirm the new paragraph renders inside item 4: `grep -c 'expected <code>aud</code>' site/specifications/proof/paso-proof-verify/index.html` → `1`.

- [ ] **Step 4: Commit**

```bash
git add docs/specifications/proof/paso-proof-verify.md docs/specifications/proof/paso-proof-risk-signals.md
git commit -m "spec(verify,risk-signals): use ad-hoc metadata when present"
```

---

## Final Verification

- `git diff feat/no-locale-mixing --stat` lists only the three spec files
  plus the `superpowers/` design and plan files.
- `git diff feat/no-locale-mixing -- docs/specifications/paso-view.md docs/specifications/paso-core.md` is empty.
- `make build` exits 0.
- Before opening the PR: remove `superpowers/` from the branch in a final
  `chore:` commit, following PR #7's convention (`c7c3ab8`).