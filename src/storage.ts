namespace PC {
  const KEY = "pertchart_v1";

  export function saveProject(p: Project): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(p));
    } catch (_) {
      // ignore
    }
  }

  export function loadProject(): Project | null {
    try {
      const s = localStorage.getItem(KEY);
      if (!s) return null;
      const p = JSON.parse(s) as Project;
      if (!p || !Array.isArray(p.tasks)) return null;
      return p;
    } catch (_) {
      return null;
    }
  }

  export function clearProject(): void {
    try { localStorage.removeItem(KEY); } catch (_) {}
  }
}
