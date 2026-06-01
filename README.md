# PORENA Quiz & Adventure

![PORENA Quiz & Adventure 로고](./assets/porena.png)

1세대 포켓몬 스프라이트 이미지를 보고 이름을 맞히는 픽셀 스타일 퀴즈 게임입니다. PokeAPI로 포켓몬 이미지와 도감 데이터를 불러오고, MockAPI로 플레이어 계정/코인/랭크 점수를 저장합니다.

## 실행 방법

별도 빌드 과정 없이 정적 파일로 실행할 수 있습니다.

```bash
python3 -m http.server 5173
```

브라우저에서 아래 주소로 접속합니다.

```text
http://localhost:5173/index.html
```

## 주요 기능

- 이름과 비밀번호를 입력하는 미니 로그인 시스템
- 로그인한 플레이어만 일반 모드/랭크 모드 플레이 가능
- 1세대 포켓몬만 랜덤 출제
- PokeAPI 세대별 스프라이트 이미지만 사용
- 정답 후 포켓몬 이름과 도감 설명 공개
- 전체화면 전환 버튼
- 우측 하단 실시간 랭킹 보드
- PORENA 로고 기반 흑백 픽셀 UI

## 게임 규칙

### 일반 모드

- 틀리면 해당 포켓몬의 이름을 보여줍니다.
- 맞히면 코인 1개를 획득합니다.
- 플레이어가 그만두기 전까지 계속 플레이할 수 있습니다.
- 화면에는 코인 수만 표시됩니다.

### 랭크 모드

- 코인이 0개면 도전할 수 없습니다.
- 틀리면 코인 1개가 차감됩니다.
- 맞히면 랭크 점수가 1점 오릅니다.
- 랭크는 PokeAPI 아이템 볼 이미지와 함께 표시됩니다.

| 점수 | 랭크 |
| --- | --- |
| 0-9 | 몬스터볼 |
| 10-19 | 슈퍼볼 |
| 20-29 | 하이퍼볼 |
| 30 | 마스터볼 |

## API 사용

### PokeAPI

포켓몬 문제 출제와 상세 정보 표시에 사용합니다.

- 포켓몬 정보: `https://pokeapi.co/api/v2/pokemon/{id}`
- 포켓몬 species 정보: `https://pokeapi.co/api/v2/pokemon-species/{id}`
- 포켓몬 스프라이트: `generation-i/yellow`, `generation-i/red-blue` 우선 사용
- 볼 이미지: PokeAPI sprites의 item 이미지 사용

### MockAPI

플레이어 계정과 진행 데이터를 저장합니다.

```text
https://6a1ce1e58858a003817c2346.mockapi.io/pokemon
```

저장 데이터 예시:

- 이름
- 비밀번호
- 코인
- 랭크 점수
- 일반 모드 정답/오답 기록
- 최근 업데이트 시간

## 파일 구조

```text
.
├── index.html
├── normal.html
├── rank.html
├── app.js
├── styles.css
└── assets
    ├── porena.png
    └── porena-logo.svg
```

## 페이지 구성

- `index.html`: 메인 페이지, 로그인, 모드 선택, 내 상태, 실시간 랭킹
- `normal.html`: 일반 모드 퀴즈 페이지
- `rank.html`: 랭크 모드 퀴즈 페이지
- `app.js`: API 호출, 로그인, 게임 로직, 랭킹, 전체화면 제어
- `styles.css`: 흑백 픽셀 UI, 반응형 레이아웃, Mulmaru 폰트 적용

## 참고 사항

이 프로젝트의 로그인은 프론트엔드와 MockAPI를 사용하는 학습용 미니 로그인입니다. 비밀번호가 실제 서비스 수준으로 암호화되거나 보호되지 않으므로, 실사용 보안 시스템으로 사용하면 안 됩니다.
