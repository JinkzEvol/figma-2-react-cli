export interface MappingLogEntry {
    version: string;
    file: string;
    hash: string;
}
export interface MappingLogOptions {
    versionDir: string;
}
/**
 * Append mapping log lines: version\tfile\thash (deterministic ordering up to caller).
 */
export declare function appendMappingLog(opts: MappingLogOptions, entries: MappingLogEntry[]): Promise<void>;
