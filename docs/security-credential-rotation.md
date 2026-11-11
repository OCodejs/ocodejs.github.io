# QStash Credential Exposure — Response Runbook

## Incident status

The public repository previously tracked `.env.local` with non-empty QStash credential fields. Treat every affected value as compromised. This document intentionally contains no credential values.

Affected credential names:
- `QSTASH_CURRENT_SIGNING_KEY`
- `QSTASH_NEXT_SIGNING_KEY`
- `QSTASH_TOKEN`
- `QSTASH_URL`

Removing the file from a new Git commit prevents future checkout of the current copy; it does not revoke credentials or erase earlier Git objects, forks, caches, artifacts, or deployment logs.

## Required provider-side actions

1. In the Upstash/QStash console, identify the affected QStash endpoint and signing-key pair.
2. Create replacement credentials using the provider's supported rotation procedure.
3. Update only the intended staging secret store/runtime binding. Do not paste values into GitHub issues, PRs, chat, logs, or source.
4. Verify consumers use the replacement values and signed requests validate.
5. Revoke the exposed token and both exposed signing keys. Confirm the old credentials fail.
6. Review QStash message delivery, signing failures, unexpected publish activity, and access logs from the earliest possible exposure date.
7. Record rotation time, affected services, operator, verification evidence, and incident closure without recording secret values.

**Owner action required:** repository access alone cannot rotate credentials in the external QStash account. Do not mark this incident resolved until provider-side revocation is verified.

## Repository remediation

- `.env.local` is removed from the current branch.
- `.gitignore` blocks local `.env*` and `.dev.vars*` files, while allowing a deliberately sanitized `.env.example`.
- CI rejects tracked local environment files.
- Run a full-history secret scan across all refs, tags, pull-request refs, Actions artifacts and deployment logs.
- Coordinate any Git history rewrite only after backup and explicit approval. Rewriting public history does not replace credential revocation and can disrupt forks and collaborators.

## Control API release gate

Do not change the dashboard API origin based only on a DNS record or Worker custom-domain attachment. Verify all of the following from the actual browser origin `https://ocodejs.co`:

- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`
- `GET /api/v1/services`
- CORS preflight and allowed-origin response
- Fresh `checkedAt`, valid schema, `Cache-Control: no-store`, request ID and failure behavior

If any check fails, keep the current endpoint unchanged and display `UNVERIFIED`; never infer service health from the presence of a Worker or DNS mapping.
