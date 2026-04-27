export const consoleMethods = [
    "debug",
    "log",
    "info",
    "warn",
    "error",
] as const;

export type ConsoleMethod = typeof consoleMethods[number];
export type ConsoleFn = (...args: unknown[]) => void;