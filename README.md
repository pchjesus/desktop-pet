# Desktop Pet v0.1.12

AI-assisted desktop pet MVP.

## Goal
A Windows desktop pet that floats above other apps, walks autonomously, reacts to clicks, and can be dragged.

## Development direction
The project is designed for an automated AI-assisted development loop:

Understand → requirements → model → impact analysis → plan → prototype → implement → test → regression test → review → refactor → document → version.

Bug loop:
Symptom → reproduce → root cause → affected scope → fix → regression test.

The human decides important UX/product choices; the AI is expected to inspect the current code, implement changes, run checks, look for regressions, and iterate instead of assuming generated code is correct.

## Character architecture
The renderer uses a lightweight character boundary. The current Neukgu character uses the shared dog-style visual structure, while `src/characters/neukgu.js` owns Neukgu-specific state classes and facing behavior. `GrowlitheCharacter` implements the same shared surface and keeps Growlithe-specific resource handling inside the character module. Future characters can implement the same small surface without changing Electron Main/IPC or the pure behavior engine.

Shared character surface:
- `setState()`
- `setFacing()`
- `render()`

Character-specific capabilities are optional and must not be moved into `pet-engine.js`.

## Characters
- Startup character selection: Neukgu, Growlithe, or Royce
- Growlithe uses the supplied HG/SS 80×80 original sprite as its base visual resource.
- Growlithe WALK uses original-resource-based pixel editing rather than a newly redrawn character.
- Growlithe uses left/right facing like Neukgu. The Pet Engine moves the desktop window; the character module controls the visual direction and motion resource.
- Growlithe SLEEP uses a closed-eye resource; REACT uses the supplied native reaction animation.
- Growlithe has a small fan-project Easter egg: after clicking Growlithe, type `pocketmon` and press Enter.
- Royce uses the Neukgu visual structure with a black/tan color treatment and has five click reactions: `멍!`, `쓰담?`, `좋아!`, `화이팅!`, and `보고 싶어!`.
- Royce has a dedicated Desktop Pet popup Easter egg: after clicking Royce, type `royce` and press Enter to open a custom popup showing `우재민 화이팅!`.

See `CHARACTER-RESOURCE-RULES.md` for the project-wide character asset policy.

## Current MVP
- Electron transparent frameless always-on-top window
- Desktop overlay rather than browser-only rendering
- Click-through on transparent/empty area
- Startup screen with Start / Manual
- Click reaction
- Right-click → quit confirmation
- Click-and-drag repositioning
- Screen/work-area clamping
- Small behavior engine: idle / walk / sit / sleep / drag / react
- Pure movement/state tests
- Final Neukgu character visual and character boundary
- Startup character selection for Neukgu, Growlithe, and Royce
- Royce-specific click reactions and Desktop Pet popup Easter egg
- Startup screen and in-app manual window

## 시작 및 설명서

- 프로그램 실행 시 시작 화면 표시
- **시작**: 시작 화면을 닫고 현재 펫 실행
- **설명서**: 별도 설명서 창 열기

## 종료 방법

- 일반 종료: 펫 위에서 **마우스 우클릭** → 종료 확인 → 확인
- 강제 종료: 작업 관리자(`Ctrl + Shift + Esc`)에서 실행 중인 **Electron** 프로세스를 찾아 작업 끝내기
- 개발 실행(CMD/터미널): 실행 중인 터미널에서 `Ctrl + C`로 종료

현재 버전은 시스템 트레이 종료 메뉴를 사용하지 않는다. 투명 영역은 기존과 같이 마우스 입력이 통과하므로, 종료하려면 펫 본체 위에서 우클릭한다.

## Run in development
1. Install Node.js LTS.
2. Open this folder in a terminal.
3. `npm install`
4. `npm test`
5. `npm run check`
6. `npm start` (or double-click `RUN-WINDOWS.bat`)

## Build a clickable Windows app
For the full Windows build-and-check flow, double-click `BUILD-WINDOWS.bat`.

It performs:
1. dependency installation
2. Electron runtime preflight (and Electron rebuild/download if the Windows binary is missing)
3. automated tests
4. syntax + desktop-shell regression checks
5. portable EXE build and artifact existence check

The resulting portable `.exe` is expected at `dist/DesktopPet-0.1.12-portable.exe`.

For a direct command-line build, run `npm run dist` after the Electron preflight has passed.
For the NSIS installer, run `npm run dist:installer`.

`INSTALL-WINDOWS.bat` is a development-run helper; it launches the source app and is not the EXE build script.

After a successful build, run `VERIFY-WINDOWS.bat` to repeat the automated checks and launch the packaged EXE for a short process smoke test. Manual visual checks are still required for the Windows overlay interactions. See `RELEASE-GUIDE.md` for the v0.1.12 Windows release and GitHub Release checklist.

## Open-source references reviewed
- coglabss/deskcat: Electron, transparent always-on-top click-through desktop pet, drag/click interactions, behavior/movement logic with 36 Jest tests.
- kokoronoka/desktopPet: Electron overlay, click-through switching, drag IPC, screen work-area clamping, renderer/main separation for walking.
- Evanfan007/desktop-pet: Electron desktop companion with transparent frameless always-on-top window, draggable Neukgu, click bubble, and state-machine animation.

These are references for architecture and behavior patterns, not code to copy wholesale.

## Verification boundary
The repository tests and build-flow checks are automated. A Windows machine must still perform the final packaged-EXE smoke test and manual GUI checks because this development environment cannot execute Windows GUI binaries.
