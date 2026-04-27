export interface PreloadEnv {
    platform: string;
    runtime: string;
    isElectron: boolean;
    isWeb: boolean;
    isDev: boolean;
}

export const detectEnv = (): PreloadEnv => {
    const ua = navigator.userAgent.toLowerCase();
    const isMac = ua.includes("mac");
    const isWindows = ua.includes("win");
    const isLinux = ua.includes("linux");
    const isElectron = ua.includes("electron");

    return {
        platform: isMac ? "mac" : isWindows ? "windows" : isLinux ? "linux" : "unknown",
        runtime: isElectron ? "electron" : "web",
        isElectron,
        isWeb: !isElectron,
        isDev: location.hostname === "localhost" || location.hostname === "127.0.0.1",
    };
};

export default detectEnv;