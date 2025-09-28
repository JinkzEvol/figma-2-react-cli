type Phase = 'fetch' | 'preScan' | 'transform' | 'assets' | 'emit' | 'write' | 'total';
export declare class Timings {
    private map;
    start(phase: Phase): void;
    stop(phase: Phase): void;
    record(): {
        [k in Phase]: number;
    };
}
export {};
