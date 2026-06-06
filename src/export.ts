namespace PC {
  function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function safeFilename(s: string): string {
    return s.replace(/[\\/:*?"<>|]+/g, "_").replace(/\s+/g, "_") || "project";
  }

  function todayStamp(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}${m}${dd}`;
  }

  export function exportPNG(p: Project): void {
    if (p.tasks.length === 0) {
      alert("내보낼 작업이 없습니다.");
      return;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    p.tasks.forEach(t => {
      if (t.x < minX) minX = t.x;
      if (t.y < minY) minY = t.y;
      if (t.x + BOX_W > maxX) maxX = t.x + BOX_W;
      if (t.y + BOX_H > maxY) maxY = t.y + BOX_H;
    });
    const pad = 40;
    const w = Math.ceil(maxX - minX) + pad * 2;
    const h = Math.ceil(maxY - minY) + pad * 2;
    const scale = 2;

    const off = document.createElement("canvas");
    off.width = w * scale;
    off.height = h * scale;
    const octx = off.getContext("2d");
    if (!octx) { alert("Canvas를 사용할 수 없습니다."); return; }
    octx.setTransform(scale, 0, 0, scale, 0, 0);

    const exportVs: ViewState = {
      selectedId: null,
      connectingFrom: null,
      connectingTo: null,
      panX: -minX + pad,
      panY: -minY + pad,
      zoom: 1
    };
    draw(octx, p, exportVs, w, h);

    off.toBlob(blob => {
      if (!blob) { alert("PNG 생성에 실패했습니다."); return; }
      downloadBlob(blob, `${safeFilename(p.name)}_${todayStamp()}.png`);
    }, "image/png");
  }

  function csvEscape(v: string | number | boolean): string {
    const s = String(v);
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  export function exportCSV(p: Project): void {
    if (p.tasks.length === 0) {
      alert("내보낼 작업이 없습니다.");
      return;
    }
    const header = ["ID", "작업명", "기간(일)", "선행작업", "ES", "EF", "LS", "LF", "여유(Slack)", "임계경로"];
    const rows = p.tasks.map(t => [
      t.id,
      t.name,
      t.duration,
      t.deps.join(";"),
      t.es,
      t.ef,
      t.ls,
      t.lf,
      t.slack,
      t.critical ? "Y" : ""
    ].map(csvEscape).join(","));
    const totalDays = projectDuration(p);
    const endDate = addDays(p.startDate, totalDays);
    const meta = [
      `# 프로젝트,${csvEscape(p.name)}`,
      `# 시작일,${csvEscape(p.startDate)}`,
      `# 총 기간(일),${totalDays}`,
      `# 종료일,${csvEscape(endDate)}`,
      ""
    ].join("\r\n");
    const csv = "\uFEFF" + meta + header.map(csvEscape).join(",") + "\r\n" + rows.join("\r\n") + "\r\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, `${safeFilename(p.name)}_${todayStamp()}.csv`);
  }
}
