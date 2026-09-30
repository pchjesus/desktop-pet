# PROJECT SPEC — Desktop Pet

## 1. Project Goal

A Windows desktop pet that remains visible above normal applications and behaves like a small autonomous companion rather than a browser widget.

The project is also an experiment in AI-assisted software development automation: the user supplies goals and makes important product/UX decisions, while the AI should repeatedly inspect, implement, test, diagnose, fix, and verify the software.

## 2. Product Requirements

### Required
- Transparent, frameless desktop overlay.
- Always-on-top behavior over browser and normal applications.
- Transparent areas pass mouse input through to the underlying application.
- Pet body receives mouse input.
- Single click produces an interaction.
- Right-click on the pet provides a quit confirmation action.
- Program launch opens a start screen with Start and Manual actions.
- Manual opens in a separate window.
- Start closes the start screen and launches the existing pet.
- Click-and-hold + movement drags the pet to another location.
- Dragging temporarily disables click-through so the pointer cannot be lost.
- Pet autonomously changes behavior and moves around the desktop.
- Pet stays inside the relevant monitor work area.
- Idle / walking / sitting / sleeping / reaction states.
- Final visual asset should be an original Minecraft-inspired blocky wolf, not a copied Minecraft asset.

### Later
- Richer behavior model.
- More animation states.
- Mouse-aware reactions.
- Sound.
- System tray menu.
- Position/preferences persistence.
- Optional start-with-Windows.
- Multi-monitor support.
- Pet personality/mood model.
- Additional pets or skins.

## 3. Non-goals for v0.1

- Final art quality.
- Full personality system.
- AI chat inside the pet.
- Network/backend.
- Account system.
- Complex persistence.

## 4. Architecture

```text
Windows Desktop
      |
      v
Electron Main Process
- owns startup, manual, and pet BrowserWindows
- owns BrowserWindow
- always-on-top
- transparent/frameless
- screen/work-area boundaries
- drag window movement
- click-through toggling
      |
      v
Preload IPC Bridge
      |
      v
Renderer
- visual state
- animation
- input classification
- behavior selection
      |
      v
Pure Pet Engine
- state selection
- target selection
- movement math
```

The UI must not become the source of truth for OS window placement. The main process owns actual window movement.

### Character system

The renderer owns shared pet behavior state and interaction flow, while character modules own character-specific visual DOM and animation behavior.

```text
Renderer
    |
    v
Character API
    |
    +-- DogCharacter
    +-- PachirisuCharacter (future)
    +-- CheeseCatCharacter (future)
```

The first implementation keeps the existing dog SVG/CSS structure unchanged and moves only dog-specific DOM manipulation (state classes and facing animation) behind `DogCharacter`. Main/IPC and the pure Pet Engine remain character-independent.

## 5. Behavior Model

Initial state set:

```text
IDLE
WALK
SIT
SLEEP
DRAG
REACT
```

Future behavior should move toward a state/event model instead of uncontrolled random timers.

Potential events:
- timer elapsed
- target reached
- click
- drag start
- drag end
- cursor proximity
- monitor boundary
- inactivity

## 6. Open-source reference strategy

Use existing open-source desktop-pet projects as implementation references, especially:

- coglabss/deskcat — behavior/movement separation and automated tests.
- kokoronoka/desktopPet — Electron overlay, click-through, drag IPC, work-area clamping, renderer/main separation.
- Evanfan007/desktop-pet — simple Electron dog with state-machine animation and drag/click behavior.

Do not blindly copy project code. Extract proven patterns, adapt them to this project's architecture, and test the adapted behavior.

## 7. AI Development Automation

For each meaningful change:

```text
Understand current project
        ↓
Define requirement
        ↓
Inspect affected architecture/state
        ↓
Identify regression risks
        ↓
Plan smallest safe change
        ↓
Implement
        ↓
Run automated tests/checks
        ↓
Reproduce failures
        ↓
Root-cause analysis
        ↓
Fix
        ↓
Re-run tests + regression checks
        ↓
Review code and behavior
        ↓
Document/version
```

The AI should not claim a feature works merely because code was generated. A change is complete only after the relevant checks pass or remaining limitations are explicitly recorded.

## 8. Human vs AI responsibility

Human:
- product goals
- important UX decisions
- acceptance criteria
- final validation of subjective behavior

AI:
- current-code inspection
- impact analysis
- implementation
- test creation
- automated checks
- bug reproduction and diagnosis
- iterative fixes
- regression review
- documentation/version notes

## 9. Versioning

v0.1.0 = desktop overlay architecture proof-of-concept.

Next likely version:
v0.2.x = validated interaction + movement system with richer behavior and real sprite pipeline.
