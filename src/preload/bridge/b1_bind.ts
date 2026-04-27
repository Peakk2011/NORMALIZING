import type { ConsoleMethod, ConsoleFn } from "../console/c0_rt.js";

type ContextBridgeLike = typeof import("electron").contextBridge;
type MarkerWindow = Window & Record<string, unknown>;

export const installRendererConsoleBridge = (
    contextBridge: ContextBridgeLike,
    methods: readonly ConsoleMethod[],
    marker: string,
): void => {
    if (typeof contextBridge.executeInMainWorld !== "function") return;

    try {
        contextBridge.executeInMainWorld({
            func: (innerMethods: ConsoleMethod[], innerMarker: string) => {
                const bridgeWindow = window as unknown as MarkerWindow;
                if (bridgeWindow[innerMarker]) return;
                bridgeWindow[innerMarker] = true;

                const serialize = (value: unknown): unknown => {
                    if (value instanceof Error) {
                        return {
                            name: value.name,
                            message: value.message,
                            stack: value.stack,
                        };
                    }

                    if (typeof value === "bigint") return value.toString();
                    if (typeof value === "function") return `[function ${value.name || "anonymous"}]`;

                    try {
                        return JSON.parse(JSON.stringify(value));
                    } catch {
                        return String(value);
                    }
                };

                const consoleRecord = console as unknown as Record<ConsoleMethod, ConsoleFn>;

                for (const method of innerMethods) {
                    const original = consoleRecord[method];
                    if (typeof original !== "function") continue;

                    consoleRecord[method] = (...args: unknown[]) => {
                        window.postMessage(
                            { [innerMarker]: true, method, args: args.map(serialize) },
                            "*",
                        );
                        return original.apply(console, args);
                    };
                }
            },
            args: [methods as ConsoleMethod[], marker],
        });
    } catch {
        // ignore bridge install failures
    }
};

export default installRendererConsoleBridge;
