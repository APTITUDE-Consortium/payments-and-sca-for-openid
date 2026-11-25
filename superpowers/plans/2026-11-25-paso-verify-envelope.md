# Signed Proof Package Envelope — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verify §4 becomes a proposed endpoint that a payment scheme may replace. Its envelope is always a signed JWT carrying `x5c`, optionally nested in a JWE, and `401` has a defined trigger.

**Architecture:** Documentation-only. One commit per document.

**Tech Stack:** Markdown, MkDocs Material.

**Spec:** `superpowers/specs/2026-11-25-paso-verify-envelope-design.md`

## Global Constraints

- No renumbering. Verify §4.3 keeps its number and is retitled "Envelope".
- Only `paso-proof-verify.md` and `index.md` change under `docs/`.
- In §4, the party that sends the request is "the sender": the Relying Party or a party forwarding on its behalf. §2 and §3 keep "Relying Party".
- `typ` value: `paso-proof-package+jwt`. JWE `cty` value: `JWT`. Baseline algorithms: `ECDH-ES`, `P-256`, `A256GCM`.
- After every task, `.venv/bin/mkdocs build --strict -d /tmp/paso-site` exits 0.

## Review Focus

- **Decryption failure** is `400` (malformed), not `401`. Only a signature, `typ` or chain failure is `401`. Task 1, processing step 1.
- **Order of checks:** the envelope is checked first (`401`), then Section 3 runs (`400`). A forged envelope must never reach Section 3. Task 1, processing steps 2–3.
- **`typ` confusion:** `signed_request` is also a JWT. The processing step checks `typ`, so `signed_request` cannot be posted as an envelope. Task 1.
- **Leftover "Relying Party" in §4.** Every §4 obligation is on "the sender". Task 4 greps the §4 range.
- **Broken anchors** to the old "4.3 Encryption" heading. Task 1 RED checks there are none.

---

### Task 1: Verify §1.1, §2, §4, references

**Files:** Modify `docs/specifications/proof/paso-proof-verify.md`.

- [ ] **RED**
  - Run: `f=docs/specifications/proof/paso-proof-verify.md; grep -cF 'application/json' $f; grep -cF 'The JWE **SHALL** be:' $f; grep -cF '### 4.3 Envelope' $f; grep -cF 'paso-proof-package+jwt' $f; grep -cF 'Section 4 proposes a standard endpoint' $f; grep -cF 'establishes trust in the certificate' $f; grep -cF '[RFC7518]' $f; rg -c '43-encryption' docs || true`
  - Expected: `2 1 0 0 0 0 0` (one per line), then no output from `rg`.
- [ ] **§1.1.** Replace "How the Relying Party obtains the Authorizing Party's public key and endpoint URI is out of scope of this document." with:

  > How the Relying Party obtains the Authorizing Party's public key and endpoint URI, and how the Authorizing Party establishes trust in the certificate of the party forwarding the proof package, are out of scope of this document.

- [ ] **§2.** Replace "Section 4 defines a standard endpoint for forwarding; the applicable Transaction Data Type Rulebook **MAY** define alternative forwarding mechanisms." with:

  > Section 4 proposes a standard endpoint for forwarding; a payment scheme or the applicable Transaction Data Type Rulebook **MAY** define alternative forwarding mechanisms.

- [ ] **§4 intro.** Replace "The Authorizing Party **MAY** expose an HTTP endpoint for receiving proof packages." with:

  > This section proposes an HTTP endpoint that an Authorizing Party **MAY** expose for receiving proof packages. It is a proposal for interoperable forwarding, not the only mechanism. In the third-party flow, forwarding is typically governed by a payment scheme, and a payment scheme or the applicable Transaction Data Type Rulebook **MAY** define a different mechanism. Sections 2 and 3 apply whichever mechanism is used.
  >
  > In this section, the sender is the Relying Party or a party forwarding the proof package on its behalf.

- [ ] **§4.1.**
  - "The Relying Party **SHALL** send" → "The sender **SHALL** send".
  - Content-Type bullet → "**Content-Type**: `application/jose`."
  - Body bullet → "**Body**: the envelope defined in Section 4.3, which is a signed JWT or a JWE containing it."
  - "When the body is `application/json`, it **SHALL** have the following structure:" → "The payload of the signed JWT **SHALL** be a JSON object with the following structure:"
  - Keep the JSON block and the two field bullets unchanged.
- [ ] **§4.2.** The `401` bullet becomes:

  > `401 Unauthorized` — the envelope signature could not be verified, its `typ` is not `paso-proof-package+jwt`, or the Authorizing Party does not trust the certificate chain in its `x5c` header parameter (Section 4.3).

- [ ] **§4.3.** Replace the heading `### 4.3 Encryption` and everything up to `## 5 References` with:

  > ### 4.3 Envelope
  >
  > The sender **SHALL** sign the proof package and **SHOULD** encrypt it.
  >
  > **Signing.** The sender **SHALL** produce a [JWS] in compact serialisation whose payload is the JSON object defined in Section 4.1. The JWS protected header **SHALL** include:
  >
  > - `alg`: the signature algorithm;
  > - `typ`: the value `paso-proof-package+jwt`;
  > - `x5c`: the sender's certificate chain, whose leaf certificate contains the signing key.
  >
  > **Encryption.** To encrypt, the sender **SHALL** nest the signed JWT in a [JWE] in compact serialisation, per [JWT] Section 5.2, encrypted to the Authorizing Party's public key so that only the Authorizing Party can decrypt it. The JWE protected header **SHALL** include `alg` (key management), `enc` (content encryption), `kid` (the Authorizing Party's key), and `cty` with the value `JWT`. When encryption is used, the sender and the Authorizing Party **SHALL** support `ECDH-ES` key agreement using the `P-256` curve with `A256GCM` content encryption, per [RFC7518], as a baseline. Other algorithms **MAY** be used when the Authorizing Party's key declares them.
  >
  > **Processing.** On receipt, the Authorizing Party **SHALL**:
  >
  > 1. If the body is a JWE (five compact segments), decrypt it and take the plaintext as the signed JWT. If decryption fails, respond `400`.
  > 2. Verify the signed JWT's signature with the key in the leaf certificate of `x5c`, verify that `typ` is `paso-proof-package+jwt`, and verify that it trusts the `x5c` certificate chain. If any of these fails, respond `401`.
  > 3. Perform the verification procedure of Section 3 on the proof package in the payload. If it fails, respond `400`.

  The old §4.3 out-of-scope sentence is dropped, because §1.1 now covers it.
- [ ] **References.** After the `[JWE]` row, add rows in the same column layout:
  - `[JWS]` → `[RFC 7515 — JSON Web Signature (JWS)](https://www.rfc-editor.org/rfc/rfc7515.html)`
  - `[JWT]` → `[RFC 7519 — JSON Web Token (JWT)](https://www.rfc-editor.org/rfc/rfc7519.html)`
  - `[RFC7518]` → `[RFC 7518 — JSON Web Algorithms (JWA)](https://www.rfc-editor.org/rfc/rfc7518.html)`
- [ ] **GREEN**
  - Run the RED greps. Expected: `0 0 1 3 1 1 2` (`paso-proof-package+jwt` appears in §4.2, the header list and processing step 2).
  - Then run the strict build. Expected: exit 0.
- [ ] **Commit:** `docs: verify proposes a signed, optionally encrypted proof package envelope`

### Task 2: Intro

**Files:** Modify `docs/index.md` at l.113, l.224, l.244, l.251, l.302 and l.319.

- [ ] **RED**
  - Run: `f=docs/index.md; grep -cF 'signed-and-encrypted' $f; grep -cF 'optionally signed and encrypted' $f; grep -cF 'signed, optionally encrypted' $f; grep -cF 'a payment scheme may define its own' $f; grep -cF 'and proposes a standard ingestion endpoint' $f; grep -cF 'signed and, as recommended, encrypted' $f`
  - Expected: `4 1 0 0 0 0`
- [ ] **l.113.** "PaSO defines a standard endpoint and an optional signed-and-encrypted envelope for this hand-off." → "PaSO proposes a standard endpoint with a signed, optionally encrypted envelope for this hand-off; a payment scheme may define its own."
- [ ] **l.224.** "PaSO defines a standard ingestion endpoint and an optional signed-and-encrypted envelope for this hand-off, so the authorizing party can independently re-verify the evidence rather than trusting the relying party's word." → "PaSO proposes a standard ingestion endpoint with a signed, optionally encrypted envelope for this hand-off; a payment scheme may define its own. Either way, the authorizing party independently re-verifies the evidence rather than trusting the relying party's word."
- [ ] **l.244.** In the diagram note, "optionally signed and encrypted" → "signed, optionally encrypted".
- [ ] **l.251.** "PaSO defines the package contents, the verification procedure, and a standard ingestion endpoint, while" → "PaSO defines the package contents and the verification procedure and proposes a standard ingestion endpoint, while".
- [ ] **l.302.** "The signed-and-encrypted proof package protects authentication data in transit between the relying party and the authorizing party." → "The proof package envelope is signed and, as recommended, encrypted, protecting authentication data in transit between the relying party and the authorizing party."
- [ ] **l.319.** "signed-and-encrypted proof package" → "signed, optionally encrypted proof package".
- [ ] **GREEN**
  - Run the RED greps. Expected: `0 0 4 2 1 1`.
  - Then run the strict build. Expected: exit 0.
- [ ] **Commit:** `docs: intro presents the ingestion endpoint as a proposal with a signed envelope`

### Task 3: Review doc

**Files:** Modify `superpowers/specs/2026-11-24-spec-review.md` header.

- [ ] **RED**
  - Run: `f=superpowers/specs/2026-11-24-spec-review.md; grep -cF '#10 — the ingestion endpoint is a proposal' $f; grep -cF 'Next up:** #11' $f`
  - Expected: `0`, `0`
- [ ] **Resolved line.** Append: "#10 — the ingestion endpoint is a proposal a payment scheme or rulebook may replace; its envelope is always a signed JWT with `x5c`, optionally nested in a JWE; `401` means the signature, `typ` or chain failed (design `2026-11-25-paso-verify-envelope-design.md`, commits `<first>`..`<last>` of Tasks 1–2)."
- [ ] **Next up line.** Replace the "#10 — the Verify §4.3 envelope is under-specified (…)." sentence with "#11 — hashes for multiple entries (Core §6.1 defines a singular `transaction_data_hash`; OID4VP's `transaction_data_hashes` is not mentioned; Verify §3 step 4 does not say which entry applies)." Keep the deferred-minors list.
- [ ] **Handoff line.** Replace it with: "**Handoff (2026-11-25):** #10 done (commits `<first>`..`<last>`). Nothing pushed: `draft-3` is ahead of `origin/draft-3`. Process per finding so far: brainstorm → short design in `superpowers/specs/` → plan in `superpowers/plans/` → inline execution with grep RED/GREEN and `.venv/bin/mkdocs build --strict -d /tmp/paso-site`."
- [ ] **GREEN**
  - Run the RED greps. Expected: `1`, `1`.
- [ ] **Commit:** `docs: mark spec review finding #10 resolved`

### Task 4: Branch check

- [ ] Run: `git diff --stat <plan commit>..HEAD -- docs/`
  - Expected: only `docs/specifications/proof/paso-proof-verify.md` and `docs/index.md`.
- [ ] Run: `awk '/^## 4 /,/^## 5 /' docs/specifications/proof/paso-proof-verify.md | grep -c 'Relying Party'`
  - Expected: `1`. The only hit is "the sender is the Relying Party or a party forwarding…".
- [ ] Run: `rg -n -i 'signed-and-encrypted|optionally signed' docs; grep -c 'application/json' docs/specifications/proof/paso-proof-verify.md`
  - Expected: no `rg` output, then `0`. Metadata §2's `Accept: application/json` is unrelated and stays.
- [ ] Run the strict build. Expected: exit 0.