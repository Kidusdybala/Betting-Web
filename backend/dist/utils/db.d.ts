export declare const db: any;
type Params = any[] | Record<string, any>;
export declare function run(sql: string, params?: Params): any;
export declare function all<T = any>(sql: string, params?: Params): T[];
export declare function get<T = any>(sql: string, params?: Params): T | undefined;
export declare function transaction<T>(fn: () => T): T;
export declare function nowIso(): string;
export declare function generateId(prefix?: string): string;
export {};
//# sourceMappingURL=db.d.ts.map