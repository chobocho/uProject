# ChoboProject — PERT Chart

1984년 Apple Macintosh와 함께 발매되었던 MacProject의 PERT 차트 UI를 오마주하여,
**TypeScript + HTML Canvas만으로** (외부 라이브러리 0개) 만든 학습용 프로젝트 관리 도구입니다.

빌드 결과물은 **단일 `release/index.html`** 한 파일로, 브라우저에서 더블클릭만 하면 바로 실행됩니다.

---

## 주요 기능

- 마우스로 끌어다 놓는 작업(Task) 박스 — 1984 Mac 스타일 흑백 그림자/타이틀바
- CPM(Critical Path Method) 자동 계산
  - 전진(Forward) 계산으로 ES / EF
  - 후진(Backward) 계산으로 LS / LF
  - 여유 시간(Slack)과 임계 경로 자동 식별 (빨간 굵은 테두리/화살표)
- 작업 간 의존성(선후 관계) 화살표
  - `Alt`(또는 `⌘`) + 드래그, 혹은 툴바 `연결` 모드
  - 순환 의존성(A→B→A) 자동 차단
- 부드러운 베지에 곡선 화살표 + 격자 배경
- 휠 확대/축소, 빈 공간 드래그로 화면 이동(Pan), `맞춤` 버튼으로 전체 보기
- LocalStorage 자동 저장 (브라우저를 닫아도 유지)
- **한글 예시 프로젝트** "신제품 개발 프로젝트" (8개 작업) 기본 탑재
- **CPM 계산 메모** — 예시 프로젝트의 ES/EF/LS/LF/Slack 계산 과정을 단계별 표로 설명
- F1 도움말 — PERT 차트 개념, 단축키, CPM 알고리즘 안내 (모두 한글)

---

## 빠른 시작

### 1. 빌드

```bash
./build.sh
```

`tsc`로 `src/*.ts` → `build/app.js`로 컴파일하고, `template.html`에 인라인 삽입하여
`release/index.html` 단일 파일을 만듭니다.

요구사항: `tsc`(TypeScript 컴파일러)와 `node`가 PATH에 있어야 합니다.
`tsc`가 없으면 자동으로 `npx -y -p typescript tsc`로 폴백합니다.

### 2. 실행

브라우저에서 `release/index.html`을 엽니다. 서버 불필요, 외부 의존성 0개.

```bash
# macOS
open release/index.html
# Linux
xdg-open release/index.html
# Windows
start release\index.html
```

---

## 조작법

### 마우스

| 동작 | 결과 |
| --- | --- |
| 작업 박스 클릭 | 선택 |
| 작업 박스 드래그 | 이동 (10px 격자 스냅) |
| 작업 박스 더블클릭 | 편집 다이얼로그 |
| 빈 영역 더블클릭 | 새 작업 추가 |
| 빈 영역 드래그 / `Shift`+드래그 | 화면 이동(Pan) |
| `Alt`(또는 `⌘`) + 박스 드래그 → 다른 박스 | 의존성 연결 |
| 마우스 휠 | 커서 위치 중심 확대/축소 |

### 키보드

| 키 | 동작 |
| --- | --- |
| `F1` 또는 `?` | 도움말 |
| `N` | 새 작업 추가 |
| `M` | 프로젝트 메모 (예시에는 CPM 계산 과정) |
| `Enter` | 선택한 작업 편집 |
| `Delete` / `Backspace` | 선택한 작업 삭제 |
| `0` | 화면 맞춤 (전체 보기) |
| `Esc` | 선택/연결 모드/대화상자 닫기 |

### 툴바

`새 작업` · `편집` · `삭제` · `연결` · `−` / `+` / `맞춤` · `메모` · `예시 불러오기` · `? 도움말`

---

## 작업 박스 보기

각 박스는 다음 정보를 표시합니다.

```
┌──────────────────────────────────┐
│ 요구사항 분석                  A │  ← 제목 + 작업 ID
├──────────────────────────────────┤
│ 기간: 5일                        │  ← Duration
├────────────────┬─────────────────┤
│ ES: 0          │ EF: 5           │  ← Earliest Start / Finish
├────────────────┼─────────────────┤
│ LS: 0          │ LF: 5           │  ← Latest Start / Finish
├────────────────┴─────────────────┤
│ 여유: 0일  ★ 임계                │  ← Slack (0이면 임계 경로)
└──────────────────────────────────┘
```

임계 경로 위의 작업은 빨간 타이틀바와 굵은 테두리, 빨간 곡선 화살표로 강조됩니다.

---

## 프로젝트 구조

```
.
├── build.sh              # 빌드 스크립트 (tsc → inline → release/index.html)
├── template.html         # HTML 셸 + Mac 스타일 CSS, __APP_JS__ 자리표시자
├── tsconfig.json         # TypeScript 컴파일 옵션 (outFile=single bundle)
├── src/
│   ├── types.ts          # Task, Project, ViewState 타입
│   ├── model.ts          # CPM 전진/후진 계산, 순환 검사
│   ├── sample.ts         # 한글 예시 프로젝트 + CPM 계산 메모
│   ├── storage.ts        # LocalStorage 자동 저장/복원
│   ├── view.ts           # Canvas 렌더링 (격자, 박스, 곡선 화살표)
│   ├── help.ts           # 도움말 HTML
│   └── main.ts           # 부트스트랩, 이벤트 핸들러, 다이얼로그
└── release/
    └── index.html        # 빌드 산출물 (단일 파일, ~43KB)
```

---

## 기술 메모

- 외부 의존성 0개. 빌드 시점에만 `tsc`(TypeScript)와 `node`(인라이너)가 필요합니다.
- 모든 TypeScript는 `namespace PC`로 묶여 있고, `--outFile` + `module: none`으로 한 파일로 번들링됩니다.
- HiDPI(Retina) 대응 — `window.devicePixelRatio`에 맞춰 캔버스 백버퍼 크기 조정.
- 좌표계: 세계 좌표(world)는 격자/박스/화살표가 사는 공간, 화면 좌표(screen)는 픽셀.
  `screenToWorld(vs, sx, sy)`로 변환, 휠 줌은 커서 위치 기준.
- CPM 계산은 위상 정렬(Kahn) 후 전진/후진 패스 1회씩. 순환은 `wouldCreateCycle`로 사전 차단.

---

## 라이선스

학습/실험용 자유 사용. 1984년 MacProject의 시각적 아이디어를 참고하였으나 모든 코드는 새로 작성한 구현체입니다.
