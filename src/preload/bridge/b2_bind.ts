import type { ConsoleMethod } from "../console/c0_rt.js";

type RendererConsoleMessage = {
    [key: string]: unknown;
    method?: ConsoleMethod;
    args?: unknown[];
};

type IpcRendererLike = typeof import("electron").ipcRenderer;

export const setupMessageRelay = (
    ipcRenderer: IpcRendererLike,
    rendererMarker: string,
    openExternalMarker: string,
    sendLog: (source: "renderer", method: ConsoleMethod, args: unknown[]) => void,
): void => {
    window.addEventListener("message", (event) => {
        if (event.source !== window) return;

        const data = event.data as RendererConsoleMessage | null;
        if (!data) return;

        const openUrl = data[openExternalMarker];
        if (typeof openUrl === "string") {
            ipcRenderer.send("open-external", openUrl);
            return;
        }

        if (data[rendererMarker] !== true) return;

        const method = data.method;
        const args = Array.isArray(data.args) ? data.args : [];
        if (!method) return;

        sendLog("renderer", method, args);
    });
};

export default setupMessageRelay;