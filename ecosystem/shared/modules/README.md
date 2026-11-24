# Shared module payloads
- `design-system/`: canonical semantic tokens.
- `shared-ui/`: accessible square-corner UI primitives; load design-system first.
- `navigation/`: central navigation renderer; Account is a source/status link only, not sign-in.
Each folder is copied independently to `.ocodejs/shared/{module}/` by the existing PR-only sync workflow.
