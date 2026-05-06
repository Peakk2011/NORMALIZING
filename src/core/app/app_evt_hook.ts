import fs from "node:fs";
import path from "node:path";
import { app, BrowserWindow, dialog, ipcMain, Menu, nativeTheme, session, shell, webContents } from "electron";
import { setupSessionHandlers } from "../config/s0.js";
import {
    clearWindowState,
    createMainWindow,
    getMainWindow,
    openDirectUrlWindow,
    openUrlWindow,
    refreshOverlay
} from "../windows/w0.js";

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

const logGpuStatus = async (): Promise<void> => {
    try {
        const featureStatus = app.getGPUFeatureStatus();
        const gpuInfo = await app.getGPUInfo("basic");
        console.log("[gpu] feature status =", featureStatus);
        console.log("[gpu] basic info =", gpuInfo);

        const softwareFlags = Object.values(featureStatus).filter((value) =>
            typeof value === "string" && (value.includes("software") || value.includes("disabled")));

        if (softwareFlags.length > 0) {
            console.warn("[gpu] Some GPU features are disabled or using software rendering.");
        }
    } catch (error) {
        console.warn("[gpu] Unable to read GPU status.", error);
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

    ipcMain.on("show-webview-context-menu", (event, payload: {
        webContentsId: number;
        currentUrl: string | null;
        canCopy: boolean;
        canPaste: boolean;
    }) => {
        const target = webContents.fromId(payload.webContentsId);
        if (!target) return;

        const ownerWindow = BrowserWindow.fromWebContents(event.sender) ?? null;
        const currentUrl = typeof payload.currentUrl === "string" ? payload.currentUrl : null;
        const canUseCurrentUrl = currentUrl !== null && isSafeExternalUrl(currentUrl);

        const menu = Menu.buildFromTemplate([
            {
                label: "Back",
                enabled: target.canGoBack(),
                click: () => target.goBack(),
            },
            {
                label: "Forward",
                enabled: target.canGoForward(),
                click: () => target.goForward(),
            },
            {
                label: "Reload",
                click: () => target.reload(),
            },
            { type: "separator" },
            {
                label: "Copy",
                enabled: payload.canCopy,
                click: () => target.copy(),
            },
            {
                label: "Paste",
                enabled: payload.canPaste,
                click: () => target.paste(),
            },
            { type: "separator" },
            {
                label: "Open in New Window",
                enabled: canUseCurrentUrl,
                click: () => {
                    if (currentUrl) {
                        openDirectUrlWindow(currentUrl);
                    }
                },
            },
            {
                label: "Save as...",
                enabled: canUseCurrentUrl,
                click: async () => {
                    if (!currentUrl) return;

                    const { canceled, filePath } = ownerWindow
                        ? await dialog.showSaveDialog(ownerWindow, {
                            title: "Save page as",
                            defaultPath: "page.html",
                            filters: [
                                { name: "Web Page", extensions: ["html", "htm"] },
                                { name: "All Files", extensions: ["*"] },
                            ],
                        })
                        : await dialog.showSaveDialog({
                        title: "Save page as",
                        defaultPath: "page.html",
                        filters: [
                            { name: "Web Page", extensions: ["html", "htm"] },
                            { name: "All Files", extensions: ["*"] },
                        ],
                    });

                    if (canceled || !filePath) return;
                    await target.savePage(filePath, "HTMLComplete");
                },
            },
        ]);

        if (ownerWindow) {
            menu.popup({ window: ownerWindow });
            return;
        }
        menu.popup();
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
        void logGpuStatus();
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