# OCodeJS Staging Incident Response Runbook

This runbook applies to staging Control API, MCP staging and Account Portal Preview. Production response must follow a separately approved operational plan.

## Severity

- **SEV-1:** staging control plane unavailable, suspected credential exposure, cross-tenant access or unauthorized write capability.
- **SEV-2:** core staging API or MCP protocol repeatedly failing; Preview auth unexpectedly exposed or misconfigured.
- **SEV-3:** isolated route, integration probe or dashboard feature degraded without security impact.
- **SEV-4:** documentation, cosmetic or non-blocking monitoring issue.

## First 10 minutes

1. Capture UTC timestamp, environment, affected service, deployment version and request/trace IDs.
2. Check liveness and readiness separately.
3. Compare current version and commit with the last known-good staging deployment.
4. Inspect sanitized logs and traces; never copy tokens, cookies, user payloads or secret values into an issue.
5. Determine whether the event is a deployment regression, dependency outage, configuration error or security incident.
6. Preserve evidence and avoid speculative configuration changes.

## Containment

- For a staging regression, stop further rollout and restore the last known-good **staging** version using the approved provider workflow.
- For suspected credential exposure, revoke/rotate the affected credential in its owning provider and invalidate related sessions. Do not merely delete the exposed source line.
- For unexpected write capability, disable the affected tool/route in staging and preserve audit evidence.
- Do not modify Production, DNS, OAuth applications, databases or shared credentials under this runbook.

## Recovery verification

- Confirm the intended staging version and traffic allocation.
- Check liveness, readiness and the affected route.
- For MCP, run initialize, notifications/initialized and tools/list; confirm only the approved read-only tool allowlist is exposed.
- Confirm auth remains disabled until dedicated Preview database and OAuth configuration have passed end-to-end tests.
- Confirm telemetry is present and secrets remain redacted.

## Incident record

Record:
- Incident ID and severity.
- Start/end time (UTC) and affected environment.
- User-visible impact and scope.
- Relevant deployment IDs, commit SHAs and request/trace IDs.
- Detection and root cause (mark unknown when not established).
- Containment, recovery and verification evidence.
- Follow-up actions, owner and due date.

Never include raw secrets, personal content or unredacted authentication material.

## Approval boundary

This runbook authorizes documentation and diagnostic steps only. It does not authorize production changes, paid resource creation, secret changes, database changes, DNS changes or deployment actions.
