import fs from "node:fs";
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

const HISTORY_FILE_PATH = path.join(app.getPath("userData"), "search-history.json");

const isSafeExternalUrl = (value: string): boolean => {
    try {
        const parsed = new URL(value);
        return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
        return false;
    }
};

const readHistoryStore = (): { history: unknown[]; activeKey: string | null } => {
    try {
        if (!fs.existsSync(HISTORY_FILE_PATH)) {
            return { history: [], activeKey: null };
        }

        const data = fs.readFileSync(HISTORY_FILE_PATH, { encoding: "utf8" });
        const parsed = JSON.parse(data);
        if (!parsed || typeof parsed !== "object") return { history: [], activeKey: null };

        return {
            history: Array.isArray((parsed as { history?: unknown[] }).history)
                ? (parsed as { history: unknown[] }).history
                : [],
            activeKey: typeof (parsed as { activeKey?: unknown }).activeKey === "string"
                ? (parsed as { activeKey: string }).activeKey
                : null,
        };
    } catch {
        return { history: [], activeKey: null };
    }
};

const writeHistoryStore = (history: unknown[], activeKey: string | null): void => {
    try {
        fs.mkdirSync(path.dirname(HISTORY_FILE_PATH), { recursive: true });
        fs.writeFileSync(HISTORY_FILE_PATH, JSON.stringify({ history, activeKey }), { encoding: "utf8" });
    } catch {
        // ignore write failures
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

    ipcMain.on("load-hist", (event) => {
        event.returnValue = readHistoryStore().history;
    });

    ipcMain.on("save-hist", (_event, history: unknown[]) => {
        const store = readHistoryStore();
        writeHistoryStore(Array.isArray(history) ? history : [], store.activeKey);
    });

    ipcMain.on("load-active", (event) => {
        const store = readHistoryStore();
        event.returnValue = store.activeKey;
    });

    ipcMain.on("save-active", (_event, activeKey: string | null) => {
        const store = readHistoryStore();
        writeHistoryStore(store.history, activeKey);
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