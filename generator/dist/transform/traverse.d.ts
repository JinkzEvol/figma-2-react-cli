import { TraverseOptions, TraverseResult } from './models';
interface RawNode {
    id: string;
    name?: string;
    type?: string;
    absoluteBoundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    children?: RawNode[];
}
export declare function traverse(root: RawNode, options?: TraverseOptions): TraverseResult;
export {};
