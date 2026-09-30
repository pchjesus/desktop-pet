# Desktop Pet v0.1.12

현재 기본 캐릭터의 이름을 **늑구(Neukgu)**로 정리하고, 새로운 캐릭터 **로이스(Royce)**를 포함한 Windows Portable 안정화 버전입니다.

## 주요 변경 사항

- 기본 캐릭터 이름 변경
  - 기본 캐릭터 명칭을 늑구(Neukgu)로 정리
  - 시작 화면, 설명서, 캐릭터 시스템 및 관련 문서에 반영
- 가디(Growlithe) 캐릭터 유지
  - 기존 이동, 방향 전환, 모션 및 `pocketmon` Easter egg 유지
- 로이스(Royce) 캐릭터 추가
  - 기존 늑구의 기본 행동 구조를 기반으로 한 검정/황갈색 외형
  - 기존 늑구 대사 3개 + 로이스 전용 대사 2개 = 총 5개 클릭 반응
  - `royce` 입력 후 Enter → `우재민 화이팅!` 전용 Desktop Pet 팝업
  - 시작 화면에 `royce` Easter egg 안내 추가
- 로이스 시작 화면 미리보기 및 앞다리 외형 조정
- 기존 Pet Engine, 이동, 드래그, 클릭/드래그 판정 및 종료 기능 유지

## 포함 기능

- 바탕화면 위에서 자동 이동
- 방향 전환
- 클릭 상호작용
- 클릭 앤 드래그 이동
- 걷기 / 앉기 / 자기 / 반응 등 공통 행동
- 시작 화면에서 캐릭터 선택
- 설명서 창
- 우클릭 종료 확인
- 캐릭터별 Easter egg

## 검증

- Node 자동 테스트: 41/41 PASS
- JavaScript syntax check: PASS
- Desktop shell regression check: PASS
- Windows Portable EXE: 사용자 환경에서 실행 및 주요 기능 확인 완료

## 배포 형태

이 Release는 **Windows Portable EXE**를 먼저 제공합니다.

별도의 설치 과정 없이 EXE를 실행할 수 있습니다.

소스 코드는 저장소의 현재 `v0.1.12` 상태를 기준으로 제공합니다.
