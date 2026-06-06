namespace PC {
  export function draw(
    ctx: CanvasRenderingContext2D,
    p: Project,
    vs: ViewState,
    cssW: number,
    cssH: number
  ): void {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, cssW, cssH);

    ctx.save();
    ctx.translate(vs.panX, vs.panY);
    ctx.scale(vs.zoom, vs.zoom);

    drawGrid(ctx, cssW, cssH, vs);

    // Arrows behind boxes
    const map = new Map<string, Task>();
    p.tasks.forEach(t => map.set(t.id, t));
    p.tasks.forEach(t => {
      t.deps.forEach(d => {
        const from = map.get(d);
        if (from) drawArrow(ctx, from, t, from.critical && t.critical);
      });
    });

    // Connecting preview
    if (vs.connectingFrom && vs.connectingTo) {
      const from = map.get(vs.connectingFrom);
      if (from) {
        ctx.save();
        ctx.strokeStyle = "#0066CC";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(from.x + BOX_W, from.y + BOX_H / 2);
        ctx.lineTo(vs.connectingTo.x, vs.connectingTo.y);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Boxes
    p.tasks.forEach(t => drawBox(ctx, t, vs));

    ctx.restore();
  }

  function drawGrid(ctx: CanvasRenderingContext2D, cssW: number, cssH: number, vs: ViewState): void {
    ctx.strokeStyle = "#EFEFEF";
    ctx.lineWidth = 1 / vs.zoom;
    const step = 20;
    const x0 = -vs.panX / vs.zoom;
    const y0 = -vs.panY / vs.zoom;
    const x1 = x0 + cssW / vs.zoom;
    const y1 = y0 + cssH / vs.zoom;
    const sx = Math.floor(x0 / step) * step;
    const sy = Math.floor(y0 / step) * step;
    ctx.beginPath();
    for (let x = sx; x < x1; x += step) {
      ctx.moveTo(x, y0);
      ctx.lineTo(x, y1);
    }
    for (let y = sy; y < y1; y += step) {
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y);
    }
    ctx.stroke();
  }

  function drawBox(ctx: CanvasRenderingContext2D, t: Task, vs: ViewState): void {
    const x = t.x, y = t.y;

    // Drop shadow
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(x + 3, y + 3, BOX_W, BOX_H);

    // Box background
    ctx.fillStyle = t.critical ? "#FFF4F2" : "#FFFFFF";
    ctx.fillRect(x, y, BOX_W, BOX_H);

    // Box border
    ctx.strokeStyle = t.critical ? "#CC0000" : "#000000";
    ctx.lineWidth = t.critical ? 2.5 : 1;
    ctx.strokeRect(x, y, BOX_W, BOX_H);

    // Title bar
    ctx.fillStyle = t.critical ? "#CC0000" : "#000000";
    ctx.fillRect(x, y, BOX_W, 22);

    // Title text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = 'bold 12px "Lucida Grande", "Geneva", "Apple SD Gothic Neo", sans-serif';
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    const name = clipText(ctx, t.name, BOX_W - 38);
    ctx.fillText(name, x + 8, y + 11);
    ctx.textAlign = "right";
    ctx.fillText(t.id, x + BOX_W - 8, y + 11);

    // Inner divider lines
    ctx.strokeStyle = "#888888";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + 44); ctx.lineTo(x + BOX_W, y + 44);
    ctx.moveTo(x, y + 66); ctx.lineTo(x + BOX_W, y + 66);
    ctx.moveTo(x, y + 88); ctx.lineTo(x + BOX_W, y + 88);
    ctx.moveTo(x + BOX_W / 2, y + 44); ctx.lineTo(x + BOX_W / 2, y + 88);
    ctx.stroke();

    // Cell text
    ctx.fillStyle = "#000000";
    ctx.font = '11px "Geneva", "Apple SD Gothic Neo", sans-serif';
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(`기간: ${t.duration}일`, x + 8, y + 33);
    ctx.fillText(`ES: ${t.es}`,  x + 8,              y + 55);
    ctx.fillText(`EF: ${t.ef}`,  x + BOX_W / 2 + 8,  y + 55);
    ctx.fillText(`LS: ${t.ls}`,  x + 8,              y + 77);
    ctx.fillText(`LF: ${t.lf}`,  x + BOX_W / 2 + 8,  y + 77);
    ctx.fillText(`여유: ${t.slack}일${t.critical ? "  ★ 임계" : ""}`, x + 8, y + 99);

    // Selection highlight
    if (vs.selectedId === t.id) {
      ctx.strokeStyle = "#0066CC";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(x - 4, y - 4, BOX_W + 8, BOX_H + 8);
      ctx.setLineDash([]);
    }
  }

  function clipText(ctx: CanvasRenderingContext2D, s: string, maxW: number): string {
    if (ctx.measureText(s).width <= maxW) return s;
    let lo = 0, hi = s.length;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (ctx.measureText(s.slice(0, mid) + "…").width <= maxW) lo = mid;
      else hi = mid - 1;
    }
    return s.slice(0, lo) + "…";
  }

  function drawArrow(ctx: CanvasRenderingContext2D, from: Task, to: Task, critical: boolean): void {
    const x1 = from.x + BOX_W;
    const y1 = from.y + BOX_H / 2;
    const x2 = to.x;
    const y2 = to.y + BOX_H / 2;

    ctx.strokeStyle = critical ? "#CC0000" : "#000000";
    ctx.fillStyle   = critical ? "#CC0000" : "#000000";
    ctx.lineWidth   = critical ? 2.5 : 1.5;

    const dx = Math.max(40, (x2 - x1) / 2);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(x1 + dx, y1, x2 - dx, y2, x2, y2);
    ctx.stroke();

    // Arrow head
    const ah = 10;
    const ang = Math.atan2(y2 - y1, dx);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - ah * Math.cos(ang - Math.PI / 7), y2 - ah * Math.sin(ang - Math.PI / 7));
    ctx.lineTo(x2 - ah * Math.cos(ang + Math.PI / 7), y2 - ah * Math.sin(ang + Math.PI / 7));
    ctx.closePath();
    ctx.fill();
  }

  export function hitTest(p: Project, vs: ViewState, sx: number, sy: number): Task | null {
    const w = screenToWorld(vs, sx, sy);
    for (let i = p.tasks.length - 1; i >= 0; i--) {
      const t = p.tasks[i];
      if (w.x >= t.x && w.x <= t.x + BOX_W && w.y >= t.y && w.y <= t.y + BOX_H) return t;
    }
    return null;
  }

  export function screenToWorld(vs: ViewState, sx: number, sy: number): { x: number; y: number } {
    return { x: (sx - vs.panX) / vs.zoom, y: (sy - vs.panY) / vs.zoom };
  }

  export function fitView(p: Project, vs: ViewState, cssW: number, cssH: number): void {
    if (p.tasks.length === 0) {
      vs.panX = 0; vs.panY = 0; vs.zoom = 1;
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
    const w = (maxX - minX) + pad * 2;
    const h = (maxY - minY) + pad * 2;
    const z = Math.min(cssW / w, cssH / h, 1.5);
    vs.zoom = z;
    vs.panX = (cssW - (maxX - minX) * z) / 2 - minX * z;
    vs.panY = (cssH - (maxY - minY) * z) / 2 - minY * z;
  }
}
