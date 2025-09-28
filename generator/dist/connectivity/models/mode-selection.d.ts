export interface ModeSelection {
    live: boolean;
    replayPath?: string;
    captureReplay: boolean;
    allowLargeFile: boolean;
    errors: string[];
}
export declare function isModeSelectionValid(selection: ModeSelection): boolean;
