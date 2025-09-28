/**
 * Deterministic SHA-1 based hash utility returning first 8 hex chars (collision window acceptable per spec).
 */
export declare function hashContent(input: string | Buffer): string;
