import type { ConsoleMethod, ConsoleFn } from "./c0_rt.js";

export const installPreloadConsole = (
    methods: readonly ConsoleMethod[],
    sendLog: (source: "preload", method: ConsoleMethod, args: unknown[]) => void,
): void => {
    for (const method of methods) {
        const original = console[method].bind(console) as ConsoleFn;
        console[method] = (...args: unknown[]) => {
            sendLog("preload", method, args);
            original(...args);
        };
    }
};

export default installPreloadConsole;