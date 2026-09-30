# Desktop Pet Release Guide

## Current release target

- Version: `v0.1.12`
- Release type: Windows Portable EXE
- Current characters: 늑구(Neukgu), 가디(Growlithe), 로이스(Royce)
- Release artifact: `DesktopPet-0.1.12-portable.exe`
- Stable baseline to keep separately: `v0.1.9`

## 1. Release 전에 확인

1. `v0.1.9 Stable Baseline` 원본 ZIP을 별도로 보관한다.
2. 현재 작업 폴더가 `v0.1.12`인지 확인한다.
3. `package.json`의 version이 `0.1.12`인지 확인한다.
4. `node_modules`가 없다면 개발 PC에서 `npm install`을 실행한다.
5. 기존 `node_modules`가 있고 의존성 변경이 없다면 다시 받을 필요는 없다.

## 2. Windows Portable EXE 빌드

Windows에서 프로젝트 폴더의 `BUILD-WINDOWS.bat`을 실행한다.

이 스크립트는 다음 순서로 수행한다.

1. npm 의존성 설치/확인
2. Electron runtime 준비 및 검증
3. 자동 테스트
4. JavaScript syntax + desktop-shell 회귀 검사
5. Windows Portable EXE 빌드
6. `dist/DesktopPet-0.1.12-portable.exe` 존재 확인

명령줄에서 직접 진행하려면 Electron preflight가 준비된 상태에서 다음을 사용할 수 있다.

```bat
npm test
npm run check
npm run test:shell
npm run dist
```

## 3. Windows에서 반드시 직접 확인

빌드가 성공했다고 바로 Release하지 않는다.

`VERIFY-WINDOWS.bat`을 실행한 뒤, 실제 EXE를 직접 실행하여 다음을 확인한다.

### 시작 화면

- 늑구 / 가디 / 로이스 3종이 정상 표시된다.
- 로이스 미리보기 이미지가 최신 버전이다.
- 캐릭터 선택 후 시작된다.
- 설명서가 열린다.

### 늑구

- 자동 이동
- 방향 전환
- 클릭 반응
- 드래그
- 앉기 / 자기 등 기존 행동
- 우클릭 종료 확인

### 가디

- 자동 이동
- 방향 전환
- 클릭 반응
- 드래그
- 기존 모션
- `pocketmon` Easter egg

### 로이스

- 늑구와 같은 기본 행동
- 검정/황갈색 외형
- 앞다리 수정 버전
- 클릭 대사 5종
  - `멍!`
  - `쓰담?`
  - `좋아!`
  - `화이팅!`
  - `보고 싶어!`
- `royce` 입력 → `우재민 화이팅!` 전용 Desktop Pet 팝업

### 종료

- 펫 위 우클릭 → 종료 확인
- 확인 / 취소 동작

## 4. EXE 파일 확인

빌드가 끝나면 다음 파일을 Release Asset으로 사용한다.

```text
dist/DesktopPet-0.1.12-portable.exe
```

EXE 파일명을 임의로 바꾸지 않는 것을 권장한다.

## 5. GitHub Release 생성

GitHub 저장소에서:

1. `Releases`로 이동
2. `Draft a new release` 선택
3. Tag: `v0.1.12`
4. Release title: `Desktop Pet v0.1.12`
5. 아래 Release Notes를 붙여넣는다.
6. `DesktopPet-0.1.12-portable.exe`를 Assets에 추가한다.
7. 초안에서 파일과 내용을 확인한다.
8. 문제가 없으면 `Publish release`한다.

## 6. Release 후 확인

GitHub Release 페이지에서 다음을 확인한다.

- 제목이 `Desktop Pet v0.1.12`인지
- 태그가 `v0.1.12`인지
- Portable EXE가 Assets에 있는지
- EXE 파일명이 `DesktopPet-0.1.12-portable.exe`인지
- Release Notes에 실제 v0.1.12 기능만 적혀 있는지
- 이전 `v0.1.9` Stable Release가 유지되어 있는지

## 7. 롤백 기준

v0.1.12 EXE에서 문제가 발견되면 기존 `v0.1.9` Stable Baseline을 기준으로 복구한다.

v0.1.12를 문제없이 검증한 뒤에는 v0.1.12를 다음 안정화 기준선으로 보관한다.
