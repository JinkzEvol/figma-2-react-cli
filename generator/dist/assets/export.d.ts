export interface RawAssetInput {
    nodeId: string;
    name: string;
    bytes: Buffer;
    ext: string;
}
export interface ExportAssetResult {
    filename: string;
    contentHash: string;
    path: string;
}
export interface ExportAssetsOptions {
    outDir: string;
    dryRun?: boolean;
    onCollision?: (base: string, attempt: number) => void;
}
/**
 * Export assets producing deterministic hashed filenames: sanitized-base--hash.ext
 * Collision strategy: if filename already exists with different content, append -N before --hash.
 */
export declare function exportAssets(inputs: RawAssetInput[], opts: ExportAssetsOptions): Promise<ExportAssetResult[]>;
