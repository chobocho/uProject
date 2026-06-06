namespace PC {
  export interface Task {
    id: string;
    name: string;
    duration: number;
    x: number;
    y: number;
    deps: string[];
    es: number;
    ef: number;
    ls: number;
    lf: number;
    slack: number;
    critical: boolean;
  }

  export interface Project {
    name: string;
    startDate: string;
    tasks: Task[];
    memo?: string;
  }

  export interface ViewState {
    selectedId: string | null;
    connectingFrom: string | null;
    connectingTo: { x: number; y: number } | null;
    panX: number;
    panY: number;
    zoom: number;
  }

  export const BOX_W = 200;
  export const BOX_H = 110;
}
