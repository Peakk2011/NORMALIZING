type ContextBridgeLike = typeof import("electron").contextBridge;
type IpcRendererLike = typeof import("electron").ipcRenderer;

export const exposeApi = (
    contextBridge: ContextBridgeLike,
    ipcRenderer: IpcRendererLike,
): void => {
    contextBridge.exposeInMainWorld("electronAPI", {
        openExternal: (url: string) => ipcRenderer.send("open-external", url),
        openUrlHtml: (platform: string, query: string) => ipcRenderer.send("open-url-html", { platform, query }),
        showWebviewContextMenu: (payload: {
            webContentsId: number;
            currentUrl: string | null;
            canCopy: boolean;
            canPaste: boolean;
        }) => ipcRenderer.send("show-webview-context-menu", payload),
        setTheme: (source: "system" | "light" | "dark") => ipcRenderer.send("set-theme", source),
        loadHist: () => ipcRenderer.sendSync("load-hist"),
        saveHist: (history: unknown[]) => ipcRenderer.send("save-hist", history),
        loadActive: () => ipcRenderer.sendSync("load-active"),
        saveActive: (activeKey: string | null) => ipcRenderer.send("save-active", activeKey),
        registerWebviewShortcut: (webContentsId: number) => ipcRenderer.send("register-webview-shortcut", webContentsId),
        onWebviewShortcut: (callback: (payload: { action: string }) => void) => {
            ipcRenderer.on("webview-shortcut", (_event, payload) => callback(payload));
        },
    });
};

export default exposeApi;