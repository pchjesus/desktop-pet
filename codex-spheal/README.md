# 대굴레오 Codex 펫 스프라이트 팩

원본: https://github.com/pchjesus/desktop-pet 의 현재 대굴레오 PNG. 이미 저장소에 커밋된 원본 픽셀을 재사용하며 AI가 그림을 다시 그리지 않는다.

## 원본 사진 / 동작

| 상태 | 원본 프레임 수 | 화면 표현 |
|---|---:|---|
| IDLE | 1 (80×80) | 기본 대기 |
| ROLL | 12 (80×80) | 진입 2 → 순환 6 → 종료 4 |
| CLAP | 8 (80×80) | 박수 180ms/frame |
| WATER GUN | 12 (120×80) | 직선 물줄기/몸 털기 175ms/frame |
| ICE BEAM | 14 (120×80) | 준비/빔/1초 동결/파쇄/복귀, 총 2950ms |
| PORTRAIT | 1 | 시작 화면/아이콘 |

**애니메이션+기본 47장, 초상화 포함 총 48장.** 원본 목록과 프레임 순서는 manifest.json을 기준으로 한다.

## 미리보기

저장소의 codex-spheal/preview.html을 열면 기존 PNG를 재사용한 6열 프레임 시트와 대기/구르기/박수/물대포/냉동빔/작업 완료 시연을 볼 수 있다. 밝고 어두운 배경을 바꿔 외곽선을 확인할 수 있다. 이는 로컬 시연이지 실제 Codex 신호 연동은 아니다.

## 실제 PNG를 포함하는 ZIP 생성

```bash
python codex-spheal/build_pack.py
```

결과: dist/Spheal-Codex-Pack.zip. 모든 기존 원본 PNG 48장, 프레임 시트 HTML, 매니페스트와 설명서가 포함된다. Pillow가 개발 환경에 설치되어 있으면 상태별 5개+전체 1개 총 6개의 투명 PNG 스프라이트 시트가 추가 생성된다. 없다면 원본 PNG와 HTML은 그대로 패키징한다. 필요 시 python -m pip install Pillow. Electron 런타임 의존성은 추가하지 않는다.

## Codex 작업 이벤트 계약

| 이벤트 | 대굴레오 반응 | 대사 |
|---|---|---|
| task_started | IDLE | 없음 |
| task_completed | WATER GUN 1회 | 작업 완료! |
| user_click | CLAP 1회 | 없음 |
| manual_watergun | WATER GUN 1회 | 물대포! |
| manual_icebeam | ICE BEAM 1회 | 냉동빔! |

작업 완료는 실제로 확인된 이벤트에서만 발생해야 한다. Codex CLI/Work/에디터의 알림 수신 방식은 서로 다를 수 있으므로 공식적으로 제공되는 연동 경로를 우선 확인한다. 자동 완료 감지 API가 없다면 수동 테스트 훅만 두고 실제 자동 연결인 것처럼 주장하지 않는다.

애니메이션의 중복 실행과 프레임 충돌을 막고 물대포/냉동빔 중 다른 공격을 끼워 넣지 않는다. 기존 캐릭터 상태와 이동/드래그와 화면 경계 동작을 보존한다.

## Work / Codex용 지시

> pchjesus/desktop-pet의 feat/spheal-codex-sprite-pack 브랜치를 사용해 줘. codex-spheal/manifest.json, preview.html, build_pack.py 및 src/characters/spheal.js의 원본 기반으로 Codex용 대굴레오 펫을 만들어 줘. 대사는 최대한 생략하고 작업 완료 신호가 실제로 수신되면 ‘작업 완료!’와 물대포 1회를 실행해 줘. 수동 물대포/냉동빔 동작은 살리고 다른 캐릭터, 공통 입력, Pet Engine, 원본 이미지를 건드리지 마. Work 또는 Codex의 신뢰할 수 있는 이벤트 제공 여부를 먼저 확인하며, 불가능한 자동 연동을 가짜로 구현하지 마. Electron Windows 실화면과 EXE는 별도로 검증하고 결과를 정확하게 보고해 줘.

## 변경 및 검증 범위

이 작업은 신규 codex-spheal/ 폴더만 추가한다. src/characters/spheal.js, src/renderer.js, src/main.js, src/pet-engine.js와 기존 PNG는 변경하지 않는다. 실제 Codex 완료 자동 감지, Electron 런타임 통합, Windows EXE 실행은 별도 작업이며 이번 팩으로 검증된 것으로 간주하지 않는다.

이 스프라이트는 포켓몬 팬 프로젝트용으로 기존 사용 자료를 정리한 것이다. 상업 배포 권리를 새로 부여하지 않는다.
