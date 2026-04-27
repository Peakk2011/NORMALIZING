export interface ElectronAPI {
    openExternal: (url: string) => void;
    openUrlHtml: (platform: string, query: string) => void;
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