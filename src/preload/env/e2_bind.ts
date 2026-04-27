import type { PreloadEnv } from "./e0_rt.js";

type ContextBridgeLike = typeof import("electron").contextBridge;

export const exposeEnv = (
    contextBridge: ContextBridgeLike,
    env: PreloadEnv,
): void => {
    contextBridge.exposeInMainWorld("env", env);
};

export default exposeEnv;