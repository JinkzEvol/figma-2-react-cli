type Phase = 'fetch' | 'preScan' | 'transform' | 'assets' | 'emit' | 'write' | 'total';

interface TimingData { start?: number; duration?: number; }

export class Timings {
  private map: Record<Phase, TimingData> = {
    fetch: {}, preScan: {}, transform: {}, assets: {}, emit: {}, write: {}, total: {}
  };
  start(phase: Phase) { this.map[phase].start = performance.now(); }
  stop(phase: Phase) {
    const d = this.map[phase];
    if (d.start != null) d.duration = performance.now() - d.start;
  }
  record(): { [k in Phase]: number } {
    const out: any = {};
    for (const p of Object.keys(this.map) as Phase[]) {
      out[p] = Math.round((this.map[p].duration || 0));
    }
    return out;
  }
}
