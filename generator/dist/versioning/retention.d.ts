export interface RunRetentionOptions {
    rootDir: string;
    keepLatest?: number;
    maxAgeDays?: number;
    dryRun?: boolean;
    confirm?: boolean;
    now?: Date;
    logger?: {
        info: (message: string) => void;
        warn?: (message: string) => void;
    };
}
export interface RetentionResult {
    candidates: string[];
    kept: string[];
    deleted: string[];
    dryRun: boolean;
}
export declare function runRetention(options: RunRetentionOptions): Promise<RetentionResult>;
