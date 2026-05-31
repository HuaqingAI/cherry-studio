# Reconciliation: brainstorming-session-2026-05-29-213953.md

## Verdict

The PRD captures the confirmed P0 product direction from the brainstorming source and preserves architecture-heavy ideas in `addendum.md`. The main intentional narrowing is that P0 is now limited to model, knowledge base, and skill resources, with homepage Agent, role packages, assistants, workflows, MCP tools, and professional mode deferred.

## Captured In PRD

- Cherry Studio enterprise edition is positioned as an employee AI workbench client, not the enterprise AI resource source of truth.
- Enterprise AI Infrastructure is the unified upstream for identity, token, model, knowledge base, skill, permission, and resource visibility.
- Enterprise login replaces manual `url + key` setup for ordinary employees.
- P0 prioritizes minimum structural disruption and reuses existing model, knowledge, and skill surfaces.
- Remote resources remain upstream-owned and are consumed by Cherry Studio as client-visible resources.
- Ordinary employee usage is the P0 target; role-specific capability packages are deferred.
- Lightweight enterprise entry replaces the earlier broader homepage Agent / mixed homepage ambition for P0.

## Captured In Addendum

- Candidate enterprise Provider direction.
- Existing Cherry Studio reusable primitives: Provider abstraction, AI Core, Agent/MCP, knowledge base, Local HTTP API, lifecycle services.
- Rule-plus-Agent orchestration concept retained as future direction, not P0 requirement.
- Tensions between low-friction onboarding, governance, remote source of truth, and local desktop responsiveness.

## Intentional Deferrals

- Homepage Agent and first-login proactive AI guidance.
- Role-specific / department-specific capability packages.
- Assistant, workflow, and MCP tool remote resource integration.
- Professional mode for advanced users.
- Enterprise administration surfaces.
- New full enterprise resource catalog.

## Remaining Gaps

- OAuth, model discovery, knowledge base, and skill execution contracts must be confirmed with enterprise AI Infrastructure before architecture can break work into implementation tasks.
- UX still needs to decide where the lightweight enterprise entry lives.
- Trial measurement ownership is undefined.
