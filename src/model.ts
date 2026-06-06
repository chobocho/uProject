namespace PC {
  export function recalc(p: Project): void {
    const tasks = p.tasks;
    if (tasks.length === 0) return;

    const map = new Map<string, Task>();
    tasks.forEach(t => map.set(t.id, t));

    const indeg = new Map<string, number>();
    tasks.forEach(t => indeg.set(t.id, t.deps.filter(d => map.has(d)).length));

    const order: Task[] = [];
    const queue: Task[] = [];
    tasks.forEach(t => { if (indeg.get(t.id) === 0) queue.push(t); });

    while (queue.length > 0) {
      const t = queue.shift()!;
      order.push(t);
      tasks.forEach(s => {
        if (s.deps.includes(t.id)) {
          indeg.set(s.id, indeg.get(s.id)! - 1);
          if (indeg.get(s.id) === 0) queue.push(s);
        }
      });
    }

    // If cycle detected (shouldn't happen since we prevent it), fall back to original order
    if (order.length !== tasks.length) {
      tasks.forEach(t => { if (!order.includes(t)) order.push(t); });
    }

    // Forward pass
    order.forEach(t => {
      if (t.deps.length === 0) {
        t.es = 0;
      } else {
        let m = 0;
        t.deps.forEach(d => {
          const dt = map.get(d);
          if (dt && dt.ef > m) m = dt.ef;
        });
        t.es = m;
      }
      t.ef = t.es + t.duration;
    });

    // Project end = max EF
    let projectEnd = 0;
    tasks.forEach(t => { if (t.ef > projectEnd) projectEnd = t.ef; });

    // Backward pass
    for (let i = order.length - 1; i >= 0; i--) {
      const t = order[i];
      const successors = tasks.filter(s => s.deps.includes(t.id));
      if (successors.length === 0) {
        t.lf = projectEnd;
      } else {
        let m = Infinity;
        successors.forEach(s => { if (s.ls < m) m = s.ls; });
        t.lf = m;
      }
      t.ls = t.lf - t.duration;
      t.slack = t.ls - t.es;
      t.critical = t.slack === 0;
    }
  }

  export function wouldCreateCycle(p: Project, fromId: string, toId: string): boolean {
    // Adding dependency: toId depends on fromId. Cycle if fromId already (transitively) depends on toId.
    if (fromId === toId) return true;
    const map = new Map<string, Task>();
    p.tasks.forEach(t => map.set(t.id, t));
    const seen = new Set<string>();
    const stack = [fromId];
    while (stack.length > 0) {
      const cur = stack.pop()!;
      if (cur === toId) return true;
      if (seen.has(cur)) continue;
      seen.add(cur);
      const t = map.get(cur);
      if (t) t.deps.forEach(d => stack.push(d));
    }
    return false;
  }

  export function nextId(p: Project): string {
    const used = new Set(p.tasks.map(t => t.id));
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (const c of letters) if (!used.has(c)) return c;
    for (let i = 1; i < 1000; i++) {
      for (const c of letters) {
        const id = c + i;
        if (!used.has(id)) return id;
      }
    }
    return "T" + Date.now();
  }

  export function projectDuration(p: Project): number {
    let m = 0;
    p.tasks.forEach(t => { if (t.ef > m) m = t.ef; });
    return m;
  }

  export function addDays(start: string, days: number): string {
    const d = new Date(start);
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }
}
