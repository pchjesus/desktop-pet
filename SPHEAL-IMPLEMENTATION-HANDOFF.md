# 대굴레오 구현 인계 기록

## CLAP / WATER GUN / ICE BEAM 개발 계약 (2026-10-23)
- 기준: main `8960f70fb409684bb69ad07a5e035282a963af52`, Patch 23 `dc669d8` 보존. 단일 개발 브랜치에서 작업하며 main 병합/배포/PR 생성은 하지 않는다.
- 원본 전신 PNG와 팔레트를 재사용한다. CLAP 8×180ms와 WATER GUN 12×175ms는 유지하고, 지느러미 연결/입 부위만 재구성한다. 기본/ROLL 리소스는 변경하지 않는다.
- ICE BEAM: 준비 350ms → 발사 900ms → 동일 프레임 동결 1000ms → 파쇄 500ms → 복귀 200ms. 입 좌표는 WATER GUN과 공유하며 120×80 전신 프레임 안에 효과를 제한한다.
- 우선순위: 발사(watergun/icebeam)는 clap만 대체 가능; 발사끼리/중복 요청은 거부. idle/walk/react는 진행 중 프레임/방향을 중단하지 않는다. 드래그 위치 이동은 보존하고 동결 프레임은 그대로 유지한다. 종료 시 현재 정상 상태로 복귀한다.
- 위험/검증: Spheal 전용 one-shot 상태와 기존 click-armed 입력만 확장. Pet Engine/Main IPC/창 크기는 유지. 가짜 시계 상태 테스트, renderer 입력·이동 통합 테스트, PNG alpha/연결성/동결 동일성 검사, 밝은/어두운 시트와 연속 재생을 확인한다. Windows Electron/EXE 실기 검증은 별도로 NOT VERIFIED 처리한다.
- 롤백: 기능 브랜치의 변경 커밋을 역순 revert하거나 위 기준 SHA를 별도 체크아웃한다. 기존 안정/롤백 커밋 및 Patch 23 문서는 덮어쓰지 않는다.

### 구현 및 인계
- 최종 자동 검증: Node **58/58 PASS**, PNG 검사 **6/6 PASS**, Linux Electron headless 입력/상태/연속 재생/범위 검사 **PASS**. Windows 실화면은 아래와 같이 별도 미검증.
- CLAP: 두 앞지느러미 뿌리부터 형태를 다시 연결하고 04–05에서 맞닿게 구성. 기존 몸통 alpha/웃는 얼굴/8×180ms 유지. WATER GUN: 코 아래의 계단형 입술·턱과 입 안쪽 발사 원점을 재구성하고 04–08만 수정. 01–03 및 09–12의 몸 털기/물방울/종료 프레임은 그대로 유지.
- ICE BEAM: 14장의 120×80 전신 PNG. 밝은 단일 빔/프레임별 결정 3개/표면 반사광, 원본 alpha를 보존한 동결 코팅, 좌우 흔들림·짧은 균열·작은 파편, 원본 전신으로 복귀. 별도 효과 DOM/새 의존성 없음.
- Spheal CSS에서 다른 캐릭터 선택 시에도 Spheal이 표시되던 기존 선택자 오류를 수정하고, Spheal의 원래 #pet 기준 위치를 명시적으로 고정. 다른 캐릭터에서 중첩 표시되지 않는지 Electron으로 검사. Main/IPC/Engine/창 크기/기본/ROLL 및 다른 캐릭터 모듈은 변경하지 않음.
- 검증 명령: `npm run check`, `npm test`, `python test/spheal-assets.py`, `node scripts/verify-spheal-headless.mjs`. PNG 편집 도구/검사는 개발용 Python + Pillow 사용(앱 의존성 추가 아님). 생성: `python scripts/generate-spheal-specials.py` (고정 기준 커밋의 원본에서 재현).
- 시각 자료: `docs/spheal-specials/{clap,watergun,icebeam}-sheet.png` (밝은/어두운 배경), `*-playback.png` (연속 APNG), `comparison.png` (Patch 23과 비교). 프레임 시트의 픽셀 검토와 자동 연속 재생 검사는 Windows 실화면의 최종 시각 승인과 구분한다.
- Linux headless: 180×150 에뮬레이션에서 양방향 효과 영역 x=25–155, y=26–106으로 잘림 없음. 34장 디코딩, 실제 타이머 기반 8/12/14프레임 재생, 상태 복귀와 캐릭터별 표시 검증. 격리 컨테이너의 로컬 신뢰 코드만 `--no-sandbox`로 실행하며 Windows 검증으로 간주하지 않음.
- Windows Electron / EXE: **NOT VERIFIED**. 실제 창/DPI별 양방향 빔, 박수의 두 지느러미 접촉, 입과 물줄기 연결, 동결 1초·파쇄·효과 제거, 이동/ROLL/드래그/우클릭/기존 명령/다른 캐릭터를 확인해야 함. 시작 화면을 통한 Spheal 선택과 packaged EXE도 Windows에서 확인 필요.

## 기준
- 원본 안정 기준: Desktop Pet v0.1.12(2)
- 현재 작업본: v0.1.12 기반 대굴레오 Patch 13
- package.json 버전은 기존 v0.1.12 유지

## Patch 13 적용 내용
- 기본 대굴레오 외형 유지
- Patch 12에서 수정한 눈 알파와 ROLL 프레임 유지
- 박수 8프레임 one-shot
- 박수 접촉 구간 2프레임
- 박수 중 행복한 눈/웃는 표정 오버레이
- 박수 접촉 순간 픽셀 임팩트 효과
- 물대포 8프레임 one-shot
- 물대포 중 행복한 눈/웃는 표정
- 입에서 현재 방향으로 발사되는 별도 픽셀 물줄기 효과
- 물대포 몸 반동
- 박수 180ms/frame, 물대포 170ms/frame
- 기존 click → pocketmon → Enter 흐름 유지
- 기존 click → watergun → Enter 흐름 유지
- Pet Engine 및 공통 입력 구조 변경 없음

## Water Gun 표현 기준
- 입에서 시작
- 현재 방향으로 수평 발사
- 스프레이/부채꼴/여러 갈래가 아닌 하나의 굵고 직선적인 물줄기
- 물줄기 자체는 캐릭터 80x80 스프라이트를 넘어 화면에서 충분한 길이로 보이도록 별도 효과 레이어 사용
- 발사 중 웃는 표정
- 발사 후 짧은 몸 반동 → 복귀

## Clap 표현 기준
- 기존 두 앞지느러미만 사용
- 준비 → 두 앞지느러미 접근 → 접촉 → 복귀의 one-shot 흐름
- 접촉 순간을 2프레임 유지
- 웃는 표정과 작은 픽셀 임팩트 추가

## 레퍼런스
- 사용자가 제공한 브이젤 Water Gun GIF: 물줄기의 두께/직선 발사감 참고
- 사용자가 제공한 대굴레오 사진: 앞지느러미를 앞으로 가져와 웃으며 박수치는 포즈 참고
- 사용자가 제공한 43x38 대굴레오 도트 움짤: 눈/입의 웃는 표정과 도트 표현 참고

## 검증
- npm test: 53 passed, 0 failed
- npm run check: passed
- spheal-base.png SHA-256 유지: 5a0d3a3fcc7e4092434333c35bd767defd3414c5205d05ecb7edc40e173258ea
- roll-01.png SHA-256 유지: 363f91e9aba03656e974f61955f133a6a0d4aad2afe7b5ce892e6bd42917f08c
- 실제 Electron/Windows 시각 검증은 아직 수행하지 않음

## 다음 검증
1. 실제 Electron에서 박수 실행
2. 박수의 앞지느러미 접촉/표정/속도 확인
3. 실제 Electron에서 Water Gun 실행
4. 물줄기 방향/두께/입 연결/표정/반동 확인
5. 흰 배경에서 기본/박수/물대포 외곽선 자글거림 확인
6. 기존 ROLL, 이동, 클릭, 드래그, 우클릭 및 다른 캐릭터 회귀 확인

## Patch 14 적용 내용
- 박수: 기존 8프레임 골격 유지, 앞지느러미 시각적 분리 강화, 눈 감고 웃는 표정/입 벌림 추가, 두 개의 작은 픽셀 박수 임팩트 효과 추가.
- 물대포: 기존 굵고 직선적인 물줄기 유지, 발사 중 웃는 표정/입 벌림 강화, 12프레임으로 확장하여 발사 후 3프레임 몸 털기(좌우 흔들림/찡그린 눈/소량 물방울)와 복귀 추가.
- 흰 배경 외곽선: 캐릭터 실루엣의 240~254 alpha 픽셀 중 투명 픽셀과 맞닿은 경계만 255로 정규화. RGB는 변경하지 않음.
- 기본 spheal-base와 ROLL은 행동 골격 변경 없이 유지하되, 외곽선 경계 개선 범위에서 spheal-base만 최소 alpha 수정.
- 공통 입력 / Pet Engine / 다른 캐릭터 코드는 변경하지 않음.

## Patch 14 검증
- npm test: 53 passed, 0 failed
- npm run check: passed
- spheal-base SHA-256: e0aaa87996727a6b4a8ee7cac72c9dfea86d2d137694f212fa2825304bac2997
- roll-01 SHA-256: 363f91e9aba03656e974f61955f133a6a0d4aad2afe7b5ce892e6bd42917f08c (unchanged)
- 실제 Electron/Windows 시각 검증: 아직 수행하지 않음

## Patch 14 Known Issue
- ROLL 시작/종료 시 프레임별 표정 차이로 눈이 순간적으로 원래 표정처럼 보이는 현상은 이번 패치에서 수정하지 않음.
- 흰 배경 외곽선은 경계 alpha 정규화 후에도 실제 Electron 표시에서 추가 확인 필요.
