# OCode.js MCP staging server

This Worker exposes a minimal, stateless MCP Streamable HTTP endpoint at `POST /mcp`.

## Staging endpoint

`https://ocodejs-mcp-staging.huynhthuongg2505-f9b.workers.dev/mcp`

## Tools

- `get_control_api_health` — reads staging liveness and readiness.
- `list_services` — reads the staging service registry.

The server is intentionally read-only. It has no account, DNS, deployment, secret, or mutation tools. It does not accept arbitrary URLs or proxy caller-supplied destinations. Backend destinations are fixed to the OCode.js staging Control API.

## Protocol

- JSON-RPC 2.0 over Streamable HTTP.
- Protocol version: `2025-03-26`.
- Supports `initialize`, `ping`, `tools/list`, `tools/call`, and initialization notifications.
- Requires `MCP-Protocol-Version: 2025-03-26` on all post-initialize requests.
- `GET` is not used for server-initiated SSE streams; clients should use POST requests.
- CORS is enabled for cross-origin MCP clients; no credentials are accepted.

## Local tests

```sh
node --test workers/mcp-server/worker.test.mjs
```

## Status

Staging implementation only. Production MCP routing and authenticated write tools are deliberately out of scope.
