type ChalkMethod = ((s: any) => string) & {
    bold: (s: any) => string;
};
/** Initializes the global chalk instance with an optional flag for forced color. Idempotent. */
export declare const chalkInit: (color?: boolean) => Promise<void>;
declare const chalkGlobal: Record<"blue" | "bold" | "cyan" | "gray" | "green" | "magenta" | "red" | "yellow", ChalkMethod>;
export default chalkGlobal;
