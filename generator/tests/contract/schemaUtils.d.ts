import Ajv, { type Options as AjvOptions } from 'ajv';
export declare function readSchema(schemaFile: string): any;
export declare function createAjv(options?: AjvOptions): Ajv;
