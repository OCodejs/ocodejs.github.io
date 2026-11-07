# OCode.js MCP staging server

This Worker exposes a minimal, stateless MCP Streamable HTTP endpoint at `POST /mcp`.

## Staging endpoint

`https://ocodejs-mcp-staging.huynhthuongg2505-f9b.workers.dev/mcp`

## Tools

- `get_control_api_health` — reads staging liveness and readiness.
- `list_services` — reads the staging service registry.
- `list_agents` — reads versioned agent definitions; every current definition is a non-executable draft.
- `get_agent_definition` — reads one agent definition by its validated ID.
- `list_providers` — lists catalogued AI provider adapters and their configuration states; never invokes inference.
- `get_provider_definition` — reads one provider adapter by its validated ID; never invokes inference.

The server is intentionally read-only. It has no account, DNS, deployment, secret, agent-execution, inference, or mutation tools. It does not accept arbitrary URLs or proxy caller-supplied destinations. Backend destinations are fixed to the OCode.js staging Control API.

## Protocol

- JSON-RPC 2.0 over Streamable HTTP.
- Protocol version: `2025-03-26`.
- Supports `initialize`, `ping`, `tools/list`, `tools/call`, and initialization notifications.
- Requires `MCP-Protocol-Version: 2025-03-26` on all post-initialize requests.
- `GET` is not used for server-initiated SSE streams; clients should use POST requests.
- CORS is enabled for cross-origin MCP clients; no credentials are accepted.
- Cloudflare Worker Logs and Traces are enabled, with query-string redaction.

## Local tests

```sh
node --test workers/mcp-server/worker.test.mjs
```

## Status

Staging implementation only. Production MCP routing and authenticated write tools are deliberately out of scope.
