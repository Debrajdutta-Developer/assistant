# Jarvis Nexus Architecture

Jarvis uses the user's `Nexus` project as the product/interaction reference and combines that spatial-AI direction with independent, open-source assistant patterns.

## Layers

1. **Experience** — premium HUD, voice, conversation, and spatial states.
2. **Nexus Core** — task classification, planning, execution-mode selection, provider scoring.
3. **Fast Action Bus** — deterministic device actions execute before an LLM is consulted.
4. **AI Runtime** — local/cloud model routing remains provider-agnostic.
5. **Memory** — local, redacted JSON memory with bounded retention.
6. **Tools** — Android bridge, files, office export, GitHub inspection, and future MCP skills.
7. **Safety** — explicit permissions for device actions and confirmation gates for sensitive operations.
8. **Verification** — agent tasks should observe/verify results rather than assuming an action succeeded.

## Design principles

- Local-first when practical.
- No mandatory dependency on one cloud provider.
- Fast-path common device commands.
- Complex requests escalate to planning and tools.
- Memory is local and sensitive tokens are redacted before persistence.
- New skills should be plugins/tools instead of hard-coded into the chat UI.
- Open-source projects are used for architecture ideas only; their source code is not copied into Jarvis.

## Open-source patterns reviewed

- Open Jarvis: accessibility automation, screen verification, memory, local models, skills, MCP, scheduler, conversation mode, and risky-action confirmation.
- DeVA: voice-driven multi-step Android UI automation.
- Agent Phone: perceive -> think -> act screen-control loop.
- Android AI Assistant: offline-first model adapters and encrypted/local data handling.
- Personal Jarvis/Jarvis projects: MCP-first tools, multi-agent orchestration, voice pipelines, and persistent memory.

## Current implementation

`lib/nexus-core.mjs` provides the orchestration primitives and `lib/action-router.mjs` now attaches a Nexus task classification/plan to every command. This keeps simple commands fast while giving future agent modes a common task model.

`lib/nexus-memory.mjs` provides the local memory foundation. Integration points should use it rather than creating separate memory stores per feature.
