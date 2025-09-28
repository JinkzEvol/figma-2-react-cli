export interface ModeSelection {
  live: boolean;
  replayPath?: string;
  captureReplay: boolean;
  allowLargeFile: boolean;
  errors: string[];
}

export function isModeSelectionValid(selection: ModeSelection): boolean {
  return selection.errors.length === 0;
}
