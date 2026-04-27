import { createRequire } from "node:module";
import path from "node:path";
import type { BrowserWindow as ElectronBrowserWindow } from "electron";
import { isDev, preloadPath } from "../config/env.js";

const requireFromAppRoot = createRequire(path.resolve(process.cwd(), "package.json"));
const { BrowserWindow } = requireFromAppRoot("electron") as typeof import("electron");

export const createWindow = (url: string, width = 600, height = 800): ElectronBrowserWindow => {
    const win = new BrowserWindow({
        width,
        height,
        show: true,
        backgroundColor: "#f8f8f6",
        titleBarStyle: "hidden",
        titleBarOverlay: {
            color: "#ffffff00",
            symbolColor: "#000000",
            height: 34,
        },
        autoHideMenuBar: true,
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
    });

    void win.webContents.session.clearCache();

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