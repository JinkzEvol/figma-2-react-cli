import type { WarningEvent } from '../connectivity/models/warning-event';
export interface WarningItem {
    code: string;
    message: string;
    layerRef?: string;
}
export declare class Warnings {
    private items;
    add(code: string, message: string, layerRef?: string, meta?: Record<string, unknown>): void;
    addEvent(event: WarningEvent): void;
    list(): WarningEvent[];
    count(): number;
    has(code: string): boolean;
}
