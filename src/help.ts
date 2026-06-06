namespace PC {
  export const HELP_HTML = `
<h1>PERT 차트 사용 안내</h1>
<p>PERT (Program Evaluation and Review Technique) 차트는 프로젝트의 각 작업을 노드(상자)로 표현하고, 작업 간의 선후 관계를 화살표로 연결하여 일정과 임계 경로(Critical Path)를 시각화하는 도구입니다.</p>

<h2>화면 구성</h2>
<p>각 작업 상자는 다음 정보를 표시합니다.</p>
<ul>
  <li><b>제목 바</b>: 작업 이름과 작업 ID</li>
  <li><b>기간 (Duration)</b>: 작업을 완료하는 데 필요한 일수</li>
  <li><b>ES</b> (Earliest Start) — 가장 빠른 시작일</li>
  <li><b>EF</b> (Earliest Finish) — 가장 빠른 종료일</li>
  <li><b>LS</b> (Latest Start) — 가장 늦은 시작일</li>
  <li><b>LF</b> (Latest Finish) — 가장 늦은 종료일</li>
  <li><b>여유 (Slack/Float)</b> — 프로젝트 종료를 지연시키지 않고 작업을 연기할 수 있는 일수</li>
</ul>
<p>여유가 <code>0</code>인 작업은 <b>임계 경로(Critical Path)</b>에 속하며, 굵은 빨간 테두리와 화살표로 표시됩니다. 이 작업이 늦어지면 전체 일정이 늦어집니다.</p>

<h2>기본 조작</h2>
<ul>
  <li><b>작업 추가</b> — 빈 영역을 더블클릭하거나 툴바의 <kbd>새 작업</kbd> 버튼</li>
  <li><b>작업 편집</b> — 상자를 더블클릭, 또는 선택 후 <kbd>편집</kbd></li>
  <li><b>작업 이동</b> — 상자를 끌어서 놓기 (10px 격자에 정렬)</li>
  <li><b>작업 선택</b> — 상자를 클릭</li>
  <li><b>작업 삭제</b> — 선택 후 <kbd>Delete</kbd> / <kbd>Backspace</kbd> 또는 툴바의 <kbd>삭제</kbd> 버튼</li>
  <li><b>의존성 연결</b> — <kbd>Alt</kbd>(또는 ⌘) 키를 누른 채 선행 작업에서 후행 작업으로 드래그. 또는 툴바의 <kbd>연결</kbd> 버튼을 눌러 연결 모드를 켠 뒤 드래그</li>
  <li><b>의존성 해제</b> — 후행 작업을 편집하여 선행 작업 목록에서 체크 해제</li>
  <li><b>화면 이동(Pan)</b> — 빈 공간 드래그 또는 <kbd>Shift</kbd>+드래그</li>
  <li><b>확대/축소</b> — 휠 스크롤, 또는 툴바의 <kbd>+</kbd> / <kbd>−</kbd> 버튼. <kbd>맞춤</kbd>으로 전체 보기</li>
</ul>

<h2>키보드 단축키</h2>
<ul>
  <li><kbd>F1</kbd> 또는 <kbd>?</kbd> — 도움말 열기</li>
  <li><kbd>N</kbd> — 새 작업 추가</li>
  <li><kbd>M</kbd> — 프로젝트 메모 열기 (예시에는 CPM 계산 과정이 들어 있습니다)</li>
  <li><kbd>Enter</kbd> — 선택한 작업 편집</li>
  <li><kbd>Delete</kbd> / <kbd>Backspace</kbd> — 선택한 작업 삭제</li>
  <li><kbd>Esc</kbd> — 선택/연결 모드 해제, 대화 상자 닫기</li>
  <li><kbd>0</kbd> — 화면 맞춤</li>
  <li>마우스 휠 — 확대/축소</li>
</ul>

<h2>임계 경로 계산 방식</h2>
<p>이 도구는 CPM(Critical Path Method) 알고리즘을 사용합니다.</p>
<ol>
  <li><b>전진 계산 (Forward Pass)</b>: 시작 작업의 ES=0에서 출발하여 각 작업의 ES, EF를 계산합니다. <code>ES = max(선행작업의 EF)</code>, <code>EF = ES + 기간</code></li>
  <li><b>후진 계산 (Backward Pass)</b>: 종료 작업의 LF=프로젝트 종료일에서 거꾸로 LS, LF를 계산합니다. <code>LF = min(후행작업의 LS)</code>, <code>LS = LF − 기간</code></li>
  <li><b>여유 시간</b>: <code>Slack = LS − ES = LF − EF</code></li>
  <li><b>임계 경로</b>: Slack=0인 작업들의 연속된 경로</li>
</ol>

<h2>팁</h2>
<ul>
  <li>변경 사항은 자동으로 브라우저의 LocalStorage에 저장됩니다.</li>
  <li><kbd>예시 불러오기</kbd> 버튼으로 언제든 한글 예시 프로젝트로 초기화할 수 있습니다.</li>
  <li>순환 의존성(A→B→A)은 자동으로 거부됩니다.</li>
</ul>
`;
}
