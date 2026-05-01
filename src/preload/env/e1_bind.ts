type ContextBridgeLike = typeof import("electron").contextBridge;
type IpcRendererLike = typeof import("electron").ipcRenderer;

export const exposeApi = (
    contextBridge: ContextBridgeLike,
    ipcRenderer: IpcRendererLike,
): void => {
    contextBridge.exposeInMainWorld("electronAPI", {
        openExternal: (url: string) => ipcRenderer.send("open-external", url),
        openUrlHtml: (platform: string, query: string) => ipcRenderer.send("open-url-html", { platform, query }),
        setTheme: (source: "system" | "light" | "dark") => ipcRenderer.send("set-theme", source),
    });
};

export default exposeApi;