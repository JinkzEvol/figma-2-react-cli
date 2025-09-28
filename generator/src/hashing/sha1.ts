import { createHash } from 'crypto';

/**
 * Deterministic SHA-1 based hash utility returning first 8 hex chars (collision window acceptable per spec).
 */
export function hashContent(input: string | Buffer): string {
  const hash = createHash('sha1');
  if (typeof input === 'string') {
    hash.update(Buffer.from(input, 'utf8'));
  } else {
    hash.update(input);
  }
  return hash.digest('hex').slice(0, 8);
}
