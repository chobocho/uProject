namespace PC {
  export const GANTT_LABEL_W = 200;
  export const GANTT_HEADER_H = 44;
  export const GANTT_ROW_H = 28;
  export const GANTT_BAR_H = 18;
  export const GANTT_DAY_MIN = 18;
  export const GANTT_DAY_MAX = 40;

  function fmtDate(start: string, dayOffset: number): string {
    return addDays(start, dayOffset);
  }

  function pickDayWidth(totalDays: number, availableW: number): number {
    if (totalDays <= 0) return GANTT_DAY_MAX;
    const fit = (availableW - GANTT_LABEL_W) / totalDays;
    return Math.max(GANTT_DAY_MIN, Math.min(GANTT_DAY_MAX, fit));
  }

  export function computeGanttSize(p: Project, availableW: number): { w: number; h: number; dayW: number; days: number } {
    const days = Math.max(1, projectDuration(p));
    const dayW = pickDayWidth(days, availableW);
    const w = GANTT_LABEL_W + days * dayW + 20;
    const h = GANTT_HEADER_H + p.tasks.length * GANTT_ROW_H + 20;
    return { w, h, dayW, days };
  }

  function sortedTasks(p: Project): Task[] {
    return p.tasks.slice().sort((a, b) => {
      if (a.es !== b.es) return a.es - b.es;
      return a.id.localeCompare(b.id);
    });
  }

  export function drawGantt(ctx: CanvasRenderingContext2D, p: Project, cssW: number, cssH: number): void {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, cssW, cssH);

    const days = Math.max(1, projectDuration(p));
    const dayW = pickDayWidth(days, cssW);
    const labelW = GANTT_LABEL_W;
    const headerH = GANTT_HEADER_H;
    const rowH = GANTT_ROW_H;
    const barH = GANTT_BAR_H;

    const tasks = sortedTasks(p);

    // Header background
    ctx.fillStyle = "#ECECEC";
    ctx.fillRect(0, 0, cssW, headerH);
    ctx.fillStyle = "#E0E0E0";
    ctx.fillRect(0, 0, labelW, headerH);

    // Header label
    ctx.fillStyle = "#000";
    ctx.font = 'bold 12px "Lucida Grande", "Geneva", "Apple SD Gothic Neo", sans-serif';
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText("작업 (ID — 이름)", 8, headerH / 2);

    // Day grid + date marks
    ctx.strokeStyle = "#DDD";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let d = 0; d <= days; d++) {
      const x = labelW + d * dayW;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, cssH);
    }
    ctx.stroke();

    // Weekly date labels — pick step so labels fit
    const labelStep = dayW >= 32 ? 1 : dayW >= 22 ? 2 : dayW >= 16 ? 5 : 7;
    const dateStep = Math.max(7, labelStep);

    ctx.fillStyle = "#333";
    ctx.font = '10px "Geneva", "Apple SD Gothic Neo", sans-serif';
    ctx.textAlign = "center";

    // Day numbers (top)
    for (let d = 0; d <= days; d += labelStep) {
      const x = labelW + d * dayW;
      ctx.fillStyle = d === 0 ? "#000" : "#555";
      ctx.fillText(String(d), x, 12);
    }

    // Date labels (bottom)
    ctx.font = '10px "Geneva", "Apple SD Gothic Neo", sans-serif';
    for (let d = 0; d <= days; d += dateStep) {
      const x = labelW + d * dayW;
      ctx.fillStyle = "#000";
      ctx.fillText(fmtDate(p.startDate, d), x, 30);
    }

    // Header bottom border
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, headerH);
    ctx.lineTo(cssW, headerH);
    ctx.moveTo(labelW, 0);
    ctx.lineTo(labelW, cssH);
    ctx.stroke();

    // Rows
    ctx.textBaseline = "middle";
    tasks.forEach((t, i) => {
      const y = headerH + i * rowH;
      if (i % 2 === 1) {
        ctx.fillStyle = "#F7F7F7";
        ctx.fillRect(0, y, cssW, rowH);
      }

      // Row label
      ctx.fillStyle = t.critical ? "#CC0000" : "#000";
      ctx.font = 'bold 11px "Lucida Grande", "Apple SD Gothic Neo", sans-serif';
      ctx.textAlign = "left";
      const label = `${t.id} — ${t.name}`;
      ctx.fillText(clipGantt(ctx, label, labelW - 12), 8, y + rowH / 2);

      // Bar
      const bx = labelW + t.es * dayW;
      const bw = Math.max(2, t.duration * dayW);
      const by = y + (rowH - barH) / 2;

      ctx.fillStyle = t.critical ? "#CC0000" : "#3B7BD9";
      ctx.fillRect(bx, by, bw, barH);
      ctx.strokeStyle = t.critical ? "#7A0000" : "#1A4F8A";
      ctx.lineWidth = 1;
      ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, barH - 1);

      // Slack indicator (light extension to LF)
      if (t.slack > 0) {
        const sx = labelW + t.ef * dayW;
        const sw = t.slack * dayW;
        ctx.fillStyle = "rgba(59,123,217,0.18)";
        ctx.fillRect(sx, by + 4, sw, barH - 8);
        ctx.strokeStyle = "#7AA3DA";
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(sx + 0.5, by + 4.5, sw - 1, barH - 9);
        ctx.setLineDash([]);
      }

      // Bar text
      ctx.fillStyle = "#FFF";
      ctx.font = 'bold 11px "Geneva", "Apple SD Gothic Neo", sans-serif';
      ctx.textAlign = "left";
      const barLabel = `${t.duration}일`;
      if (ctx.measureText(barLabel).width + 8 <= bw) {
        ctx.fillText(barLabel, bx + 4, by + barH / 2);
      } else {
        ctx.fillStyle = "#000";
        ctx.fillText(barLabel, bx + bw + 4, by + barH / 2);
      }
    });

    // Dependency lines (thin)
    const indexById = new Map<string, number>();
    tasks.forEach((t, i) => indexById.set(t.id, i));
    ctx.strokeStyle = "rgba(80,80,80,0.55)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    tasks.forEach((t, i) => {
      t.deps.forEach(d => {
        const pi = indexById.get(d);
        if (pi === undefined) return;
        const pre = tasks[pi];
        const x1 = labelW + pre.ef * dayW;
        const y1 = headerH + pi * rowH + rowH / 2;
        const x2 = labelW + t.es * dayW;
        const y2 = headerH + i * rowH + rowH / 2;
        const mx = x2 - 4;
        ctx.moveTo(x1, y1);
        ctx.lineTo(mx, y1);
        ctx.lineTo(mx, y2);
        ctx.lineTo(x2, y2);
      });
    });
    ctx.stroke();

    // Legend (top-right of header) — mask underlying day/date labels to avoid overlap
    ctx.font = '10px "Geneva", "Apple SD Gothic Neo", sans-serif';
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const totalDays = projectDuration(p);
    const endDate = addDays(p.startDate, totalDays);
    const line1 = `총 ${totalDays}일 · ${p.startDate} ~ ${endDate}`;
    const line2 = "■ 임계경로  ■ 일반  ░ 여유";
    const legendW = Math.max(ctx.measureText(line1).width, ctx.measureText(line2).width);
    const maskPad = 6;
    const maskX = cssW - 8 - legendW - maskPad;
    const maskW = legendW + maskPad + 8;
    ctx.fillStyle = "#ECECEC";
    ctx.fillRect(maskX, 1, maskW, headerH - 2);
    ctx.fillStyle = "#000";
    ctx.fillText(line1, cssW - 8, 12);
    ctx.fillText(line2, cssW - 8, 30);
  }

  function clipGantt(ctx: CanvasRenderingContext2D, s: string, maxW: number): string {
    if (ctx.measureText(s).width <= maxW) return s;
    let lo = 0, hi = s.length;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (ctx.measureText(s.slice(0, mid) + "…").width <= maxW) lo = mid;
      else hi = mid - 1;
    }
    return s.slice(0, lo) + "…";
  }

  export function exportGanttPNG(p: Project): void {
    if (p.tasks.length === 0) {
      alert("내보낼 작업이 없습니다.");
      return;
    }
    const size = computeGanttSize(p, 1600);
    const scale = 2;
    const off = document.createElement("canvas");
    off.width = size.w * scale;
    off.height = size.h * scale;
    const octx = off.getContext("2d");
    if (!octx) { alert("Canvas를 사용할 수 없습니다."); return; }
    octx.setTransform(scale, 0, 0, scale, 0, 0);
    drawGantt(octx, p, size.w, size.h);
    off.toBlob(blob => {
      if (!blob) { alert("PNG 생성에 실패했습니다."); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safe = p.name.replace(/[\\/:*?"<>|]+/g, "_").replace(/\s+/g, "_") || "project";
      const d = new Date();
      const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
      a.href = url;
      a.download = `${safe}_gantt_${stamp}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  }
}
