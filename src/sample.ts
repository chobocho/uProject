namespace PC {
  export function sampleProject(): Project {
    const blank = (id: string, name: string, dur: number, x: number, y: number, deps: string[]): Task => ({
      id, name, duration: dur, x, y, deps,
      es: 0, ef: 0, ls: 0, lf: 0, slack: 0, critical: false
    });
    return {
      name: "신제품 개발 프로젝트",
      startDate: "2026-06-08",
      tasks: [
        blank("A", "요구사항 분석",   5,   60, 120, []),
        blank("B", "시장 조사",       7,   60, 320, []),
        blank("C", "제품 설계",      10,  320, 120, ["A"]),
        blank("D", "프로토타입 제작", 8,  320, 320, ["B"]),
        blank("E", "내부 테스트",     6,  580, 120, ["C", "D"]),
        blank("F", "문서 작성",       4,  580, 320, ["C"]),
        blank("G", "사용자 테스트",   5,  840, 220, ["E", "F"]),
        blank("H", "출시 준비",       3, 1100, 220, ["G"])
      ],
      memo: SAMPLE_MEMO
    };
  }

  const SAMPLE_MEMO = `
<h1>예시 프로젝트의 CPM 계산 메모</h1>
<p>이 예시는 8개의 작업으로 구성된 "신제품 개발 프로젝트"입니다. 모든 시점은 프로젝트 시작일(2026-06-08) <b>0일째</b> 기준 누적 일수입니다.</p>

<h2>의존 관계 요약</h2>
<ul>
  <li>A(5일), B(7일): 선행 작업 없음</li>
  <li>C(10일) ← A</li>
  <li>D(8일) ← B</li>
  <li>E(6일) ← C, D</li>
  <li>F(4일) ← C</li>
  <li>G(5일) ← E, F</li>
  <li>H(3일) ← G</li>
</ul>

<h2>1단계 — 전진 계산 (Forward Pass)</h2>
<p>공식: <code>ES = max(선행작업.EF)</code>, <code>EF = ES + 기간</code></p>
<table>
  <thead><tr><th>작업</th><th>의존</th><th>기간</th><th>ES 계산</th><th>EF 계산</th></tr></thead>
  <tbody>
    <tr><td>A</td><td>—</td><td>5</td><td>0</td><td>0+5 = <b>5</b></td></tr>
    <tr><td>B</td><td>—</td><td>7</td><td>0</td><td>0+7 = <b>7</b></td></tr>
    <tr><td>C</td><td>A</td><td>10</td><td>max(A.EF)=5</td><td>5+10 = <b>15</b></td></tr>
    <tr><td>D</td><td>B</td><td>8</td><td>max(B.EF)=7</td><td>7+8 = <b>15</b></td></tr>
    <tr><td>E</td><td>C,D</td><td>6</td><td>max(15,15)=15</td><td>15+6 = <b>21</b></td></tr>
    <tr><td>F</td><td>C</td><td>4</td><td>max(C.EF)=15</td><td>15+4 = <b>19</b></td></tr>
    <tr><td>G</td><td>E,F</td><td>5</td><td>max(21,19)=21</td><td>21+5 = <b>26</b></td></tr>
    <tr><td>H</td><td>G</td><td>3</td><td>max(G.EF)=26</td><td>26+3 = <b>29</b></td></tr>
  </tbody>
</table>
<p>→ <b>프로젝트 총 기간 = 29일</b> (가장 큰 EF). 종료일 2026-07-07.</p>

<h2>2단계 — 후진 계산 (Backward Pass)</h2>
<p>공식: <code>LF = min(후행작업.LS)</code>, 종료 작업은 <code>LF = 프로젝트 종료(29)</code>, <code>LS = LF − 기간</code></p>
<table>
  <thead><tr><th>작업</th><th>후행</th><th>LF 계산</th><th>LS 계산</th></tr></thead>
  <tbody>
    <tr><td>H</td><td>(종료)</td><td><b>29</b></td><td>29−3 = <b>26</b></td></tr>
    <tr><td>G</td><td>H</td><td>H.LS = <b>26</b></td><td>26−5 = <b>21</b></td></tr>
    <tr><td>F</td><td>G</td><td>G.LS = <b>21</b></td><td>21−4 = <b>17</b></td></tr>
    <tr><td>E</td><td>G</td><td>G.LS = <b>21</b></td><td>21−6 = <b>15</b></td></tr>
    <tr><td>D</td><td>E</td><td>E.LS = <b>15</b></td><td>15−8 = <b>7</b></td></tr>
    <tr><td>C</td><td>E,F</td><td>min(15,17) = <b>15</b></td><td>15−10 = <b>5</b></td></tr>
    <tr><td>B</td><td>D</td><td>D.LS = <b>7</b></td><td>7−7 = <b>0</b></td></tr>
    <tr><td>A</td><td>C</td><td>C.LS = <b>5</b></td><td>5−5 = <b>0</b></td></tr>
  </tbody>
</table>

<h2>3단계 — 여유 시간 (Slack) 및 임계 경로</h2>
<p>공식: <code>Slack = LS − ES</code>. Slack=0이면 임계 경로.</p>
<table>
  <thead><tr><th>작업</th><th>ES</th><th>EF</th><th>LS</th><th>LF</th><th>여유</th><th>임계?</th></tr></thead>
  <tbody>
    <tr class="crit"><td>A</td><td>0</td><td>5</td><td>0</td><td>5</td><td>0</td><td>★</td></tr>
    <tr><td>B</td><td>0</td><td>7</td><td>0</td><td>7</td><td>0</td><td>★</td></tr>
    <tr class="crit"><td>C</td><td>5</td><td>15</td><td>5</td><td>15</td><td>0</td><td>★</td></tr>
    <tr><td>D</td><td>7</td><td>15</td><td>7</td><td>15</td><td>0</td><td>★</td></tr>
    <tr class="crit"><td>E</td><td>15</td><td>21</td><td>15</td><td>21</td><td>0</td><td>★</td></tr>
    <tr><td>F</td><td>15</td><td>19</td><td>17</td><td>21</td><td><b>2</b></td><td>—</td></tr>
    <tr class="crit"><td>G</td><td>21</td><td>26</td><td>21</td><td>26</td><td>0</td><td>★</td></tr>
    <tr class="crit"><td>H</td><td>26</td><td>29</td><td>26</td><td>29</td><td>0</td><td>★</td></tr>
  </tbody>
</table>
<p><b>임계 경로:</b> A → C → E → G → H (또는 B → D → E → G → H). 두 경로 모두 29일로 동일.</p>
<p><b>F만 여유 2일</b>이 있어 일정 조정 가능. 즉 F는 15일째에 시작하지 않고 17일까지 미뤄도 전체 일정에 영향이 없습니다.</p>

<h2>실무 활용 팁</h2>
<ul>
  <li>임계 경로 위의 작업이 하루 늦어지면 프로젝트도 하루 늦어집니다. 자원 배분 우선순위가 높습니다.</li>
  <li>여유가 있는 작업(F)은 인력/예산을 임계 경로로 재배치할 수 있는 후보입니다.</li>
  <li>이 예시는 두 개의 임계 경로(A-C와 B-D)가 같은 길이로 합류하는 형태로, 어느 한쪽이 단축되어도 다른 쪽이 임계가 되어 단축 효과가 제한적입니다 — 두 경로를 동시에 단축해야 일정이 줄어듭니다.</li>
</ul>
`;
}
