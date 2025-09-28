/**
 * Multi-style text splitter (T032).
 * Given a raw text string and style ranges, produces ordered segments with associated style indexes.
 */
export interface TextStyleRange {
    start: number;
    end: number;
    styleId: string;
}
export interface TextSegment {
    text: string;
    styleId: string;
}
export declare function splitText(raw: string, ranges: TextStyleRange[]): TextSegment[];
