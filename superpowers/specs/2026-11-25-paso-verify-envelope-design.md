# PaSO: Signed Proof Package Envelope — Design

Date: 2026-11-25 · Branch: `draft-3` · Size: small change · Origin: spec review finding #10 (`2026-11-24-spec-review.md`)

## Intent

When a proof package is forwarded over HTTP, the Authorizing Party must know who sent it. Today Verify §4 can't tell it that:
- §4.3 asks for a "signed" JWE, which doesn't exist without nesting.
- §4.3 says `x5c` goes in "the JOSE header" without saying which one.
- The plain `application/json` body (§4.1) authenticates nobody, so the `401` in §4.2 has no defined trigger.

The signed Authorization Request already proves what the Relying Party asked for. The envelope signature adds proof of who *sent* the package.

The endpoint itself is only a proposal. In the third-party flow, forwarding is normally a payment scheme's job (`index.md` §7.2), and a scheme may define its own transport. The proof package (Verify §2) and the verification procedure (§3) apply whatever the transport.

## Goals

- Every body sent to the endpoint is signed by the sender. Encryption stays optional (SHOULD).
- One unambiguous structure: a signed JWT, optionally nested inside a JWE.
- `401` has a defined trigger.
- Verify and the intro say plainly that §4 is a proposal and that a payment scheme or rulebook may replace it.

## Non-goals

- **How the Authorizing Party decides which sender certificates to trust,** or how a sender learns the Authorizing Party's key and endpoint. These stay out of scope (scheme or bilateral).
- **The rest of the endpoint's semantics** (`200` vs. authorised, `jti` replay window): review #24.
- **Envelope claims beyond the proof package** (`iat`, `aud`). The KB-JWT `jti` already covers replay, and the package is bound to one issuer.

## Approaches considered

- **Chosen: always sign, optionally encrypt.** The body is a signed JWT carrying `x5c`. When encrypted, that JWT is wrapped in a JWE. `401` means the signature or the chain failed.
- **Rejected: plain JSON with transport authentication** (mTLS, OAuth client auth). `401` stays defined outside the spec, so independently built parties don't interoperate.
- **Rejected: encryption only, no sender authentication.** Anyone holding a captured package could submit it first, and the real sender would get `409`.

## Changes

1. **`paso-proof-verify.md`**
   - **§1.1:** the out-of-scope sentence also covers how the Authorizing Party establishes trust in sender certificates.
   - **§2:** alternative forwarding mechanisms may be defined by the applicable rulebook **or by a payment scheme**.
   - **§4 intro:** the endpoint is a proposal for interoperable forwarding. A payment scheme or the applicable rulebook **MAY** define a different mechanism, and Sections 2 and 3 apply regardless.
   - **§4.1:** `Content-Type: application/jose` always. The body is the signed JWT of §4.3, or a JWE containing it. Remove the plain `application/json` body. The JSON structure (`signed_request`, `vp_token`) becomes the JWT payload.
   - **§4.2 `401`:** the envelope signature failed to verify, or the `x5c` chain is not trusted by the Authorizing Party.
   - **§4.3, retitled "Envelope":**
     - **Signing (REQUIRED).** A JWS compact serialisation signed by the sender. The protected header includes `alg`, `typ: "paso-proof-package+jwt"`, and `x5c` with the sender's certificate chain. The payload is the §4.1 JSON object.
     - **Encryption (SHOULD).** The signed JWT nested in a JWE compact serialisation, encrypted to the Authorizing Party's key (RFC 7519 §5.2). The JWE protected header includes `alg`, `enc`, `kid` and `cty: "JWT"`. The baseline algorithms are those of Risk Signals §7.6 (`ECDH-ES` with `P-256`, `A256GCM`).
     - **Processing.** The Authorizing Party decrypts if a JWE is present, verifies the signature and chain (`401` on failure), then runs Section 3 on the payload (`400` on failure).
   - **References:** add [JWS], [JWT] and [RFC7518].
2. **`index.md`:** l.113 and l.224 become "a proposed standard endpoint with a signed, optionally encrypted envelope; a payment scheme may define its own". The l.244 diagram note becomes "signed, optionally encrypted". The l.319 table cell becomes "signed, optionally encrypted proof package". Found while planning: l.251 "defines … a standard ingestion endpoint" becomes "proposes", and l.302's in-transit claim becomes "signed and, as recommended, encrypted".
3. **`2026-11-24-spec-review.md`:** mark #10 resolved and set "Next up" to #11.

## Calls made (correct if wrong)

- **The signer is "the sender",** not "the Relying Party". This covers a scheme or PSP forwarding on the RP's behalf.
- **There is one media type, `application/jose`.** The Authorizing Party tells the two forms apart by the number of compact segments (3 = JWS, 5 = JWE).
- **There is an explicit `typ`,** so the envelope can't be confused with `signed_request`, which is also a JWT.
- **Sign-then-encrypt order** (the RFC 7519 §5.2 nesting): the signature stays verifiable after decryption, and the sender's certificate isn't exposed in transit.
- **No worked example is added.** The structure is standard JOSE nesting, and Verify has no appendix today.