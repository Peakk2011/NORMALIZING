export {};

declare global {
    interface Window {
        electronAPI: {
            openExternal: (url: string) => void;
            openUrlHtml: (platform: string, query: string) => void;
        };
    }
}