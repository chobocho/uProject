namespace PC {
  let project: Project;
  const vs: ViewState = {
    selectedId: null,
    connectingFrom: null,
    connectingTo: null,
    panX: 0,
    panY: 0,
    zoom: 1
  };

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let statusEl: HTMLElement;
  let connectMode = false;

  type DragKind = "none" | "task" | "pan" | "connect";
  let drag: DragKind = "none";
  let dragTask: Task | null = null;
  let dragOffset = { x: 0, y: 0 };
  let panStart = { x: 0, y: 0 };

  function $(id: string): HTMLElement {
    const el = document.getElementById(id);
    if (!el) throw new Error("missing #" + id);
    return el;
  }

  function cssSize(): { w: number; h: number } {
    const r = canvas.getBoundingClientRect();
    return { w: r.width, h: r.height };
  }

  function render(): void {
    const dpr = window.devicePixelRatio || 1;
    const { w, h } = cssSize();
    const pw = Math.max(1, Math.round(w * dpr));
    const ph = Math.max(1, Math.round(h * dpr));
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(ctx, project, vs, w, h);
    updateStatus();
  }

  function updateStatus(): void {
    const total = projectDuration(project);
    const endDate = addDays(project.startDate, total);
    const sel = vs.selectedId ? project.tasks.find(t => t.id === vs.selectedId) : null;
    let s = `프로젝트: ${project.name}  ·  시작 ${project.startDate}  ·  총 ${total}일  ·  종료 ${endDate}  ·  작업 ${project.tasks.length}개`;
    if (sel) s += `  ·  선택: ${sel.id} ${sel.name}`;
    if (connectMode || vs.connectingFrom) s += `  ·  [연결 모드]`;
    statusEl.textContent = s;
  }

  function saveAndRender(): void {
    recalc(project);
    saveProject(project);
    render();
  }

  function openModal(id: string): void { $(id).classList.add("open"); }
  function closeModal(id: string): void { $(id).classList.remove("open"); }
  function modalOpen(): boolean {
    return document.querySelectorAll(".modal.open").length > 0;
  }

  function openHelp(): void {
    $("help-body").innerHTML = HELP_HTML;
    openModal("modal-help");
  }

  function openGantt(): void {
    ($("gantt-title") as HTMLElement).textContent = project.name;
    const modal = $("modal-gantt");
    modal.classList.add("open");
    requestAnimationFrame(() => renderGantt());
  }

  function renderGantt(): void {
    const canvas = $("gantt-canvas") as HTMLCanvasElement;
    const body = $("gantt-body");
    const availableW = Math.max(600, body.clientWidth - 20);
    const size = computeGanttSize(project, availableW);
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = size.w + "px";
    canvas.style.height = size.h + "px";
    canvas.width = Math.round(size.w * dpr);
    canvas.height = Math.round(size.h * dpr);
    const c = canvas.getContext("2d");
    if (!c) return;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawGantt(c, project, size.w, size.h);
  }

  function openMemo(): void {
    const body = $("memo-body");
    ($("memo-title") as HTMLElement).textContent = `프로젝트 메모 — ${project.name}`;
    if (project.memo && project.memo.trim().length > 0) {
      body.innerHTML = project.memo;
    } else {
      body.innerHTML =
        '<p style="color:#666">이 프로젝트에는 저장된 메모가 없습니다. ' +
        '<kbd>예시 불러오기</kbd>를 누르면 CPM 계산 과정이 담긴 예시 메모를 확인할 수 있습니다.</p>';
    }
    openModal("modal-memo");
  }

  function openEditor(task: Task | null): void {
    const isNew = task === null;
    const t: Task = task ?? {
      id: nextId(project),
      name: "새 작업",
      duration: 1,
      x: (cssSize().w / 2 - vs.panX) / vs.zoom - BOX_W / 2,
      y: (cssSize().h / 2 - vs.panY) / vs.zoom - BOX_H / 2,
      deps: [],
      es: 0, ef: 0, ls: 0, lf: 0, slack: 0, critical: false
    };
    ($("edit-title") as HTMLElement).textContent = isNew ? "새 작업 추가" : "작업 편집";
    ($("ed-id") as HTMLInputElement).value = t.id;
    ($("ed-name") as HTMLInputElement).value = t.name;
    ($("ed-duration") as HTMLInputElement).value = String(t.duration);

    const depsBox = $("ed-deps");
    depsBox.innerHTML = "";
    const others = project.tasks.filter(o => o.id !== t.id);
    if (others.length === 0) {
      depsBox.innerHTML = '<div style="color:#888">선행 작업으로 지정할 다른 작업이 없습니다.</div>';
    } else {
      others.forEach(o => {
        const lab = document.createElement("label");
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.value = o.id;
        cb.checked = t.deps.includes(o.id);
        // Prevent picking a successor as a dependency (would create cycle)
        if (!isNew && wouldCreateCycle(project, o.id, t.id)) {
          cb.disabled = true;
        }
        lab.appendChild(cb);
        lab.appendChild(document.createTextNode(" " + o.id + " — " + o.name));
        depsBox.appendChild(lab);
      });
    }

    const saveBtn = $("ed-save") as HTMLButtonElement;
    saveBtn.onclick = () => {
      const newName = ($("ed-name") as HTMLInputElement).value.trim() || t.name;
      const newDur = Math.max(0, parseInt(($("ed-duration") as HTMLInputElement).value, 10) || 0);
      const newDeps: string[] = [];
      depsBox.querySelectorAll("input[type=checkbox]").forEach(el => {
        const c = el as HTMLInputElement;
        if (c.checked) newDeps.push(c.value);
      });
      t.name = newName;
      t.duration = newDur;
      t.deps = newDeps;
      if (isNew) project.tasks.push(t);
      closeModal("modal-edit");
      saveAndRender();
    };

    openModal("modal-edit");
    setTimeout(() => ($("ed-name") as HTMLInputElement).focus(), 50);
  }

  function deleteTask(id: string): void {
    project.tasks = project.tasks.filter(t => t.id !== id);
    project.tasks.forEach(t => { t.deps = t.deps.filter(d => d !== id); });
    if (vs.selectedId === id) vs.selectedId = null;
    saveAndRender();
  }

  function onMouseDown(e: MouseEvent): void {
    if (modalOpen()) return;
    const r = canvas.getBoundingClientRect();
    const sx = e.clientX - r.left;
    const sy = e.clientY - r.top;
    const t = hitTest(project, vs, sx, sy);

    if (e.button === 1 || (e.shiftKey && !t)) {
      drag = "pan";
      panStart = { x: sx - vs.panX, y: sy - vs.panY };
      return;
    }

    if (t) {
      vs.selectedId = t.id;
      if (connectMode || e.altKey || e.metaKey) {
        drag = "connect";
        vs.connectingFrom = t.id;
        vs.connectingTo = { x: sx, y: sy };
      } else {
        drag = "task";
        dragTask = t;
        const w = screenToWorld(vs, sx, sy);
        dragOffset = { x: w.x - t.x, y: w.y - t.y };
      }
    } else {
      vs.selectedId = null;
      drag = "pan";
      panStart = { x: sx - vs.panX, y: sy - vs.panY };
    }
    render();
  }

  function onMouseMove(e: MouseEvent): void {
    if (drag === "none") return;
    const r = canvas.getBoundingClientRect();
    const sx = e.clientX - r.left;
    const sy = e.clientY - r.top;

    if (drag === "task" && dragTask) {
      const w = screenToWorld(vs, sx, sy);
      dragTask.x = Math.round((w.x - dragOffset.x) / 10) * 10;
      dragTask.y = Math.round((w.y - dragOffset.y) / 10) * 10;
      render();
    } else if (drag === "pan") {
      vs.panX = sx - panStart.x;
      vs.panY = sy - panStart.y;
      render();
    } else if (drag === "connect") {
      const w = screenToWorld(vs, sx, sy);
      vs.connectingTo = { x: w.x, y: w.y };
      render();
    }
  }

  function onMouseUp(e: MouseEvent): void {
    if (drag === "connect" && vs.connectingFrom) {
      const r = canvas.getBoundingClientRect();
      const sx = e.clientX - r.left;
      const sy = e.clientY - r.top;
      const t = hitTest(project, vs, sx, sy);
      if (t && t.id !== vs.connectingFrom) {
        if (!t.deps.includes(vs.connectingFrom)) {
          if (!wouldCreateCycle(project, vs.connectingFrom, t.id)) {
            t.deps.push(vs.connectingFrom);
            saveAndRender();
          } else {
            alert("순환 의존성이 됩니다. 연결할 수 없습니다.");
          }
        }
      }
      vs.connectingFrom = null;
      vs.connectingTo = null;
    }
    if (drag === "task") saveProject(project);
    drag = "none";
    dragTask = null;
    render();
  }

  function onDblClick(e: MouseEvent): void {
    if (modalOpen()) return;
    const r = canvas.getBoundingClientRect();
    const sx = e.clientX - r.left;
    const sy = e.clientY - r.top;
    const t = hitTest(project, vs, sx, sy);
    if (t) openEditor(t);
    else openEditor(null);
  }

  function onWheel(e: WheelEvent): void {
    if (modalOpen()) return;
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    const sx = e.clientX - r.left;
    const sy = e.clientY - r.top;
    const before = screenToWorld(vs, sx, sy);
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    vs.zoom = Math.min(3, Math.max(0.25, vs.zoom * factor));
    const after = screenToWorld(vs, sx, sy);
    vs.panX += (after.x - before.x) * vs.zoom;
    vs.panY += (after.y - before.y) * vs.zoom;
    render();
  }

  function onKey(e: KeyboardEvent): void {
    if (e.key === "F1" || (e.key === "?" && !modalOpen())) {
      e.preventDefault();
      openHelp();
      return;
    }
    if (e.key === "Escape") {
      if (modalOpen()) {
        document.querySelectorAll(".modal.open").forEach(m => m.classList.remove("open"));
      } else {
        vs.selectedId = null;
        vs.connectingFrom = null;
        vs.connectingTo = null;
        connectMode = false;
      }
      render();
      return;
    }
    if (modalOpen()) return;
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")) return;

    if ((e.key === "Delete" || e.key === "Backspace") && vs.selectedId) {
      e.preventDefault();
      deleteTask(vs.selectedId);
      return;
    }
    if (e.key === "Enter" && vs.selectedId) {
      const t = project.tasks.find(x => x.id === vs.selectedId);
      if (t) openEditor(t);
      return;
    }
    if (e.key === "n" || e.key === "N") {
      openEditor(null);
      return;
    }
    if (e.key === "m" || e.key === "M") {
      openMemo();
      return;
    }
    if (e.key === "g" || e.key === "G") {
      openGantt();
      return;
    }
    if (e.key === "0") {
      const s = cssSize();
      fitView(project, vs, s.w, s.h);
      render();
      return;
    }
  }

  function zoom(delta: number): void {
    const s = cssSize();
    const cx = s.w / 2, cy = s.h / 2;
    const before = screenToWorld(vs, cx, cy);
    vs.zoom = Math.min(3, Math.max(0.25, vs.zoom * delta));
    const after = screenToWorld(vs, cx, cy);
    vs.panX += (after.x - before.x) * vs.zoom;
    vs.panY += (after.y - before.y) * vs.zoom;
    render();
  }

  export function init(): void {
    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const c = canvas.getContext("2d");
    if (!c) { alert("Canvas 2D를 사용할 수 없습니다."); return; }
    ctx = c;
    statusEl = $("status");

    project = loadProject() ?? sampleProject();
    recalc(project);

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("dblclick", onDblClick);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", render);

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => render());
      ro.observe(canvas);
    }

    $("btn-help").addEventListener("click", openHelp);
    $("btn-memo").addEventListener("click", openMemo);
    $("btn-new").addEventListener("click", () => openEditor(null));
    $("btn-edit").addEventListener("click", () => {
      if (vs.selectedId) {
        const t = project.tasks.find(x => x.id === vs.selectedId);
        if (t) openEditor(t);
      } else {
        alert("편집할 작업을 먼저 선택하세요.");
      }
    });
    $("btn-delete").addEventListener("click", () => {
      if (vs.selectedId) deleteTask(vs.selectedId);
      else alert("삭제할 작업을 먼저 선택하세요.");
    });
    $("btn-connect").addEventListener("click", () => {
      connectMode = !connectMode;
      ($("btn-connect") as HTMLButtonElement).classList.toggle("active", connectMode);
      render();
    });
    $("btn-zoomin").addEventListener("click", () => zoom(1.2));
    $("btn-zoomout").addEventListener("click", () => zoom(1 / 1.2));
    $("btn-fit").addEventListener("click", () => {
      const s = cssSize();
      fitView(project, vs, s.w, s.h);
      render();
    });
    $("btn-export-png").addEventListener("click", () => exportPNG(project));
    $("btn-export-csv").addEventListener("click", () => exportCSV(project));
    $("btn-gantt").addEventListener("click", openGantt);
    $("gantt-export-png").addEventListener("click", () => exportGanttPNG(project));
    $("btn-reset").addEventListener("click", () => {
      if (confirm("현재 프로젝트를 버리고 한글 예시 프로젝트를 불러옵니다. 계속하시겠습니까?")) {
        project = sampleProject();
        saveAndRender();
        const s = cssSize();
        fitView(project, vs, s.w, s.h);
        render();
      }
    });

    document.querySelectorAll(".modal").forEach(m => {
      m.addEventListener("click", e => {
        if (e.target === m) (m as HTMLElement).classList.remove("open");
      });
    });

    requestAnimationFrame(() => {
      const s = cssSize();
      fitView(project, vs, s.w, s.h);
      render();
    });
  }
}

window.addEventListener("DOMContentLoaded", () => PC.init());
