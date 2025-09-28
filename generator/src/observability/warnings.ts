import type { WarningEvent } from '../connectivity/models/warning-event';

export interface WarningItem {
  code: string;
  message: string;
  layerRef?: string;
}

export class Warnings {
  private items: WarningEvent[] = [];

  add(code: string, message: string, layerRef?: string, meta?: Record<string, unknown>) {
    this.items.push({
      code,
      message,
      layerRef: layerRef ?? null,
      meta: meta ?? null,
      timestamp: new Date().toISOString()
    });
  }

  addEvent(event: WarningEvent) {
    this.items.push({
      code: event.code,
      message: event.message,
      layerRef: event.layerRef ?? null,
      meta: event.meta ?? null,
      timestamp: event.timestamp ?? new Date().toISOString()
    });
  }

  list(): WarningEvent[] {
    return this.items.map((item) => ({
      code: item.code,
      message: item.message,
      layerRef: item.layerRef ?? null,
      meta: item.meta ?? null,
      timestamp: item.timestamp
    }));
  }

  count(): number {
    return this.items.length;
  }

  has(code: string): boolean {
    return this.items.some((w) => w.code === code);
  }
}
