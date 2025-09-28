export interface VersionRecordEntry {
    versionDir: string;
    baseComponent: string;
    runTimestamp: string;
    previousVersionDir: string | null;
    fileHashes: Record<string, string>;
}
export interface EnsureVersionDirResult {
    versionDir: string;
    versionName: string;
    previousVersionDir: string | null;
}
export interface VersioningOptions {
    outParent: string;
    baseComponent: string;
}
export declare function ensureVersionDir(opts: VersioningOptions): Promise<EnsureVersionDirResult>;
export declare function updateVersionMap(opts: VersioningOptions, ensure: EnsureVersionDirResult, files: string[]): Promise<VersionRecordEntry[]>;
