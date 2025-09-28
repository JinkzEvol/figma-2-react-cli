export type ReplaySource = 'network' | 'replay';

export interface ReplayRequestEnvelope {
  method: string;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
}

export interface ReplayResponseEnvelope {
  status: number;
  bodyPath: string;
  headers: Record<string, string>;
  recordedAt: string;
}

export interface ReplaySegment {
  id: string;
  request: ReplayRequestEnvelope;
  response: ReplayResponseEnvelope;
  sha1: string;
  source: ReplaySource;
}
