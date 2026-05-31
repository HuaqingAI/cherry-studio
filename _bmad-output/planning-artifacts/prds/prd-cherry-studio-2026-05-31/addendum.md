# Addendum

This addendum captures architecture-oriented and implementation-depth material from the brainstorming input. It is supporting context for architecture and delivery planning, not the PRD's primary requirement narrative.

## Source Inputs

- `_bmad-output/brainstorming/brainstorming-session-2026-05-29-213953.md`

## Architecture-Oriented Context

- Cherry Studio already has platform-like primitives that should be reused where possible: Provider abstraction, AI Core, Agent/MCP, knowledge base, Local HTTP API, and lifecycle service container.
- The repository is in a v2 refactor period. The PRD should avoid requiring compatibility with legacy v1 data stacks except through explicit migration paths already owned by the refactor.
- Enterprise access should not be modeled as a purely new model-inference path. The first implementation emphasis is access semantics: identity, authorization, provider credential acquisition, resource discovery, metadata, and workbench entry orchestration.
- The enterprise AI Infrastructure is the upstream source of truth for models, credentials, enterprise AI resources, permissions, visibility, and distribution state.
- Cherry Studio and professional agent clients such as Codex are peer consumers of the same enterprise AI Infrastructure, not parent/child products.

## Candidate Technical Direction

- Introduce an enterprise-specific Provider, named later, as the user-facing enterprise entry. Internally, it may reuse the existing `newapi` call shape where possible.
- Architecture must decide whether the enterprise Provider is a distinct provider type or a credential resolver over an existing call shape before implementation breakdown.
- Replace manual `url + key` setup for enterprise users with an authorization login flow that returns enough provider context for model use and resource discovery.
- Keep remote enterprise resources as remote identities. Cherry Studio should fetch metadata and executable entry points, then consume them remotely when needed.
- Persist only local session state, cache state, user preferences, and implementation-required indexes. Avoid deep-copying enterprise resources into Cherry Studio as local source-of-truth records.
- For P0, inject remote resources into existing containers where practical, limited to model, knowledge base, and skill. Defer assistant, workflow, MCP tool, and fully new enterprise resource catalog work until the first loop proves out.
- P0 skill consumption should be modeled as a remote executable entry point: metadata, input schema, invoke API, result schema, timeout, and error category. It should not register remote skills as local MCP tools or workflow/Agent orchestration primitives.
- Resource metadata caches are display accelerators only. They must not authorize execution after upstream revocation or denial.
- P0 supports a single active enterprise account. Multi-enterprise concurrency and tenant switching are deferred; account changes should clear enterprise session state, resource metadata cache, and enterprise preferences.
- Rule-first, Agent-assisted orchestration remains a future direction: deterministic rules decide visibility, priority, and default entries; later Agent behavior may explain, guide, and recommend within those allowed bounds. It is not a P0 homepage Agent requirement.

## Contract Freeze Before Architecture Breakdown

- OAuth: authorization URL, callback scheme, required parameters, state validation, token exchange, refresh, revoke, and error returns.
- Model discovery: model id, display name, availability, default model rule, disabled reason, and error mapping.
- Remote knowledge base: choose P0 invocation mode from retrieval API, QA API, or chat-context reference.
- Remote skill: metadata, input schema, invoke API, result schema, sync/async mode, timeout, and error mapping.
- Resource cache and revocation: TTL, forced refresh, stale/offline display, revoked state, and post-403 invalidation behavior.

## P0 Scope Corrections

- P0 resource scope is limited to model, knowledge base, and skill. Assistants, workflows, MCP tools, role-specific packages, homepage Agent behavior, and professional mode are intentionally deferred.
- Enterprise AI Infrastructure owns OAuth pages, authorization server behavior, resource administration, permission governance, and visibility configuration.
- Cherry Studio must remain a pure client in this initiative. It may store local tokens, local preferences, local cache, and UI state, but it must not become a service-side policy or resource-management tier.
- The first entry experience should be lightweight: enough to make enterprise login and enterprise resources discoverable, without rebuilding the main homepage around a new Agent-led workbench.

## Product-Architecture Tensions To Preserve

- Low-friction employee onboarding versus advanced user freedom.
- Enterprise governance and predictable defaults versus AI-personalized guidance.
- Remote source-of-truth resource governance versus responsive local desktop experience.
- Minimal disruption to existing Cherry Studio structure versus enough abstraction for future multi-client reuse.
