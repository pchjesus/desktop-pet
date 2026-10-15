# AI Agent Development Contract — desktop-pet

## Mandatory sources
Read [B+ Integrated Development & CI Policy](docs/AI_ASSISTED_DEVELOPMENT_BPLUS_v1.0.md) before new features, refactors, CI changes or release decisions. This repo's README, specifications, development logs, existing code, approved UX decisions and domain/safety contract prevail on conflicts.

## Workflow
Plan one coherent user outcome/version before implementation; perform a proportional Definition of Ready and affected-state risk review. Work in reversible internal commits; perform relevant local/agent checks as often as necessary. Use fast + risk-focused PR tests, and full historical/brower/packaging regression when changing core state, doing a broad refactor or releasing. Never mislabel unrun tests PASS. Release only after the user-approved gates. Retain urgent hotfixes for consequential defects; do not force unrelated tasks into one giant patch.

## Repository-specific protection
Preserve Electron IPC, moving/dragging/clicking pet behavior, animation/sprite assets and Windows packaging requirements; read README.md and PROJECT_SPEC.md.

## Scope
This registration is documentation/policy-only; it does not authorize behavior, data, deployment or visibility changes. Do not claim REAL-device or specialist acceptance from automated CI alone.
