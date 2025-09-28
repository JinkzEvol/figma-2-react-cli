/**
 * Typography & style mapping (T030) – initial subset.
 * Converts simplified font/style descriptors to Tailwind utility classes.
 */
export interface FontStyleInput {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number;
    lineHeightPx?: number;
    letterSpacing?: number;
    color?: string;
}
export interface TypographyClassesResult {
    classes: string[];
}
export declare function mapTypography(input: FontStyleInput): TypographyClassesResult;
