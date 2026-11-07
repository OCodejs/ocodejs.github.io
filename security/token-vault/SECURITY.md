# Security Policy

## Secret handling
Never commit API keys, access tokens, passwords, private keys, cookies, session values, encryption keys, or password hashes. Use Cloudflare Worker secrets or an approved secret manager.

## Exposure response
Any credential pasted into a chat, issue, pull request, terminal transcript, or log must be treated as compromised: revoke it, rotate it, and inspect audit logs. The initial password supplied in the project request must not be used as a production credential.

## Access control
Plaintext reveal is restricted to `owner` and `security_admin`. Developers, automation agents, and auditors cannot reveal token values. Grant each identity only the minimum project scope required. Do not use a shared administrator password as a team credential.

## Operational controls
- HTTPS only.
- Secure, HttpOnly, SameSite=Strict cookies.
- CSRF protection for state-changing requests.
- Short session lifetime and server-side revocation.
- Rate-limit login and reveal operations.
- Encrypt token values with AES-256-GCM and unique random IVs.
- Keep encryption, signing, and password-verifier material separate.
- Audit create, reveal, rotate, delete, permission changes, and failed login events.
- Back up D1 with access controls; backups are sensitive.
- Never log request bodies for secret endpoints.
