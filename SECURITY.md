# SECURITY

## Reporting a vulnerability

We take security seriously. Do **not** open a public issue for security
vulnerabilities — email the maintainer directly or open a
[private vulnerability report](https://github.com/toxicwind/bge-oracle/security/advisories/new).

Please include:

- The affected version and file.
- A minimal reproduction.
- Impact description.

## Known considerations

- Embedding vectors are opaque numeric arrays; sanitize any text you embed for
  prompt-injection payloads before sending to a remote endpoint.
- The API key resolves via secretsmith keyring on the estate — never commit
  `.env` or key material. The `.gitignore` excludes `.env`.