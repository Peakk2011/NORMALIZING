export interface ElectronAPI {
    openExternal: (url: string) => void;
    openUrlHtml: (platform: string, query: string) => void;
    showWebviewContextMenu: (payload: {
        webContentsId: number;
        currentUrl: string | null;
        canCopy: boolean;
        canPaste: boolean;
    }) => void;
    setTheme: (source: "system" | "light" | "dark") => void;
    registerWebviewShortcut: (webContentsId: number) => void;
    onWebviewShortcut: (callback: (payload: { action: string }) => void) => void;
    loadHist: () => unknown[];
    saveHist: (history: unknown[]) => void;
    loadActive: () => string | null;
    saveActive: (activeKey: string | null) => void;
}

export interface NormalizingEnv {
    platform: string;
    runtime: string;
    isElectron: boolean;
    isWeb: boolean;
    isDev: boolean;
}

export type BrowserFind = (
    query: string,
    caseSensitive?: boolean,
    backwards?: boolean,
    wrap?: boolean,
    wholeWord?: boolean,
    searchInFrames?: boolean,
    showDialog?: boolean,
) => unknown;

declare global {
    interface Window {
        electronAPI?: ElectronAPI;
        env?: NormalizingEnv;
        __normalizingEnv?: NormalizingEnv;
        find?: BrowserFind;
    }
}

export {};