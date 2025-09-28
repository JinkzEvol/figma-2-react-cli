/**
 * Maps simplified auto layout properties to Tailwind utility classes.
 * This is an initial heuristic; refined in later tasks & tests (T028, T064).
 */
export interface AutoLayoutProps {
    direction?: 'HORIZONTAL' | 'VERTICAL';
    gap?: number;
    alignItems?: 'MIN' | 'CENTER' | 'MAX';
    justifyContent?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
    padding?: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
}
export interface AutoLayoutResult {
    classes: string[];
}
export declare function mapAutoLayout(props: AutoLayoutProps): AutoLayoutResult;
