import { createRequire } from "node:module";
import path from "node:path";
import { setupSessionHandlers } from "../config/s0.js";
import {
    clearWindowState,
    createMainWindow,
    getMainWindow,
    openUrlWindow,
    refreshOverlay
} from "../windows/w0.js";

const requireFromAppRoot = createRequire(path.resolve(process.cwd(), "package.json"));
const { app, ipcMain, nativeTheme, session, shell, BrowserWindow } = requireFromAppRoot("electron") as typeof import("electron");

const isSafeExternalUrl = (value: string): boolean => {
    try {
        const parsed = new URL(value);
        return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
        return false;
    }
};

export const registerApplicationEvents = (): void => {
    ipcMain.on("open-url-html", (_event, data: { platform: string; query: string }) => {
        openUrlWindow(data.platform, data.query);
    });

    ipcMain.on("open-external", (_event, url: string) => {
        if (!isSafeExternalUrl(url)) {
            return;
        }
        void shell.openExternal(url);
    });

    ipcMain.on("set-theme", (_event, source: string) => {
        if (source === "system" || source === "light" || source === "dark") {
            nativeTheme.themeSource = source;
            refreshOverlay();
        }
    });

    app.whenReady().then(() => {
        setupSessionHandlers(session.defaultSession);
        createMainWindow();
    });

    app.on("before-quit", () => {
        clearWindowState();
        const mainWindow = getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.destroy();
        }
        void session.defaultSession.clearStorageData();
    });

    app.on("window-all-closed", () => {
        if (process.platform !== "darwin" && getMainWindow() === null) {
            app.quit();
        }
    });

    app.on("activate", () => {
        if (getMainWindow() === null && BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
};