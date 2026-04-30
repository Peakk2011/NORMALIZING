import { createRequire } from "node:module";
import path from "node:path";
import type { BrowserWindow as ElectronBrowserWindow, BrowserWindowConstructorOptions } from "electron";
import { isDev, preloadPath } from "../config/env.js";

const requireFromAppRoot = createRequire(path.resolve(process.cwd(), "package.json"));
const { BrowserWindow, nativeImage } = requireFromAppRoot("electron") as typeof import("electron");

// Resolve the correct icon format per platform
const getIconPath = (): string => {
    const base = path.resolve(process.cwd(), "assets", "logo", "app_icons");
    if (process.platform === "darwin") return path.join(base, "application_icon.icns");
    if (process.platform === "win32") return path.join(base, "application_icon.ico");
    return path.join(base, "application_icon.png");
};


export const createWindow = (url: string, width = 600, height = 585): ElectronBrowserWindow => {
    const windowOptions: BrowserWindowConstructorOptions = {
        width,
        height,
        show: true,
        backgroundColor: "#00ffffff",
        titleBarStyle: "hidden",
        titleBarOverlay: {
            color: "#ffffff00",
            symbolColor: "#000000",
            height: 34,
        },
        autoHideMenuBar: true,
        // Set icon at window creation so it appears in taskbar, task manager, and dock
        icon: nativeImage.createFromPath(getIconPath()),
        webPreferences: {
            preload: preloadPath,
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            spellcheck: false,
            backgroundThrottling: true,
            webviewTag: true,
            experimentalFeatures: false,
            disableBlinkFeatures: "CSSVariables,FontLoadingEvents",
            imageAnimationPolicy: "animateOnce",
        },
    };

    const win = new BrowserWindow(windowOptions);

    // Clear session cache on every window creation to avoid stale data
    void win.webContents.session.clearCache();

    // Open detached DevTools only in development
    if (isDev) {
        setTimeout(() => {
            if (!win.isDestroyed()) {
                win.webContents.openDevTools({ mode: "detach" });
            }
        }, 500);
    }

    void win.loadURL(url);
    return win;
};