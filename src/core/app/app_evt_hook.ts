import fs from "node:fs";
import path from "node:path";
import {
    app,
    BrowserWindow,
    dialog,
    globalShortcut,
    ipcMain,
    Menu,
    nativeTheme,
    session,
    shell,
    webContents
} from "electron";
import { setupSessionHandlers } from "../config/s0.js";
import {
    clearWindowState,
    createMainWindow,
    getMainWindow,
    openDirectUrlWindow,
    openUrlWindow,
    refreshOverlay,
    setupWebviewPopupGuard
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
        if (!fs.existsSync(HISTORY_FILE_PATH)) return { history: [], activeKey: null };

        const data   = fs.readFileSync(HISTORY_FILE_PATH, { encoding: "utf8" });
        const parsed = JSON.parse(data) as Record<string, unknown>;
        if (!parsed || typeof parsed !== "object") return { history: [], activeKey: null };

        return {
            history:   Array.isArray(parsed["history"]) ? parsed["history"] : [],
            activeKey: typeof parsed["activeKey"] === "string" ? parsed["activeKey"] : null,
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
        const gpuInfo       = await app.getGPUInfo("basic");
        console.log("[gpu] feature status =", featureStatus);
        console.log("[gpu] basic info =", gpuInfo);

        const softwareFlags = Object.values(featureStatus).filter(
            (v) => typeof v === "string" && (v.includes("software") || v.includes("disabled"))
        );
        if (softwareFlags.length > 0) {
            console.warn("[gpu] Some GPU features are disabled or using software rendering.");
        }
    } catch (error) {
        console.warn("[gpu] Unable to read GPU status.", error);
    }
};

const SHORTCUT_INJECT_SCRIPT = `
(function() {
    if (window.__normalizingShortcutInjected) return;
    window.__normalizingShortcutInjected = true;
    const ACTION_MAP = { f: 'open-search', w: 'close-tab', t: 'new-tab', r: 'toggle-settings' };
    window.addEventListener('keydown', function(e) {
        if ((!e.ctrlKey && !e.metaKey) || e.altKey) return;
        const key    = e.key.toLowerCase();
        const action = (key === '+' || key === '=' || key === ',') ? 'toggle-settings' : ACTION_MAP[key];
        if (!action) return;
        e.preventDefault();
        e.stopPropagation();
        window.postMessage({ __normalizing: true, action }, '*');
    }, true);

    window.addEventListener('click', function(e) {
        if (e.defaultPrevented || e.button !== 0) return;
        if (!e.ctrlKey && !e.metaKey) return;
        if (e.altKey || e.shiftKey) return;

        let target = e.target;
        while (target && target.nodeName !== 'A') {
            target = target.parentElement;
        }
        if (!target || !target.href) return;

        e.preventDefault();
        e.stopPropagation();
        window.open(target.href, '_blank');
    }, true);
})();
`;

const webviewShortcutGuard = new Set<number>();

const registerWebviewShortcut = (webContentsId: number): void => {
    if (typeof webContentsId !== "number" || webContentsId <= 0) return;
    if (webviewShortcutGuard.has(webContentsId)) return;

    const guest = webContents.fromId(webContentsId);
    if (!guest) return;

    webviewShortcutGuard.add(webContentsId);

    console.log("[shortcut] registering id:", webContentsId);
    console.log("[shortcut] guest type:", guest.getType());
    console.log("[shortcut] guest url:", guest.getURL());
    console.log("[shortcut] all webContents:", webContents.getAllWebContents().map(w => `id=${w.id} type=${w.getType()} url=${w.getURL()}`));

    const tryInject = (): void => {
        if (guest.isDestroyed()) return;
        console.log("[shortcut] injecting into id:", webContentsId, "url:", guest.getURL());
        guest.executeJavaScript(SHORTCUT_INJECT_SCRIPT)
            .then(() => console.log("[shortcut] inject SUCCESS id:", webContentsId))
            .catch((err) => console.error("[shortcut] inject FAILED id:", webContentsId, err));
    };

    const handleShortcutInput = (event: Electron.Event, input: Electron.Input): void => {
        if (input.type !== 'keyDown') return;
        if (!input.control && !input.meta) return;
        if (input.alt) return;

        const key = String(input.key ?? '').toLowerCase();
        const isFindShortcut = key === 'f';
        const isCloseShortcut = key === 'w';
        const isNewTabShortcut = key === 't';
        const isToggleSettingsShortcut = key === ',' || key === 'r' || key === '+' || key === '=';
        if (!isFindShortcut && !isCloseShortcut && !isNewTabShortcut && !isToggleSettingsShortcut) return;

        const action = isFindShortcut
            ? 'open-search'
            : isCloseShortcut
                ? 'close-tab'
                : isNewTabShortcut
                    ? 'new-tab'
                    : 'toggle-settings';

        const hostWebContents = guest.hostWebContents;
        if (!hostWebContents || hostWebContents.isDestroyed()) return;

        hostWebContents.send('webview-shortcut', { action });
        event.preventDefault();
    };

    tryInject();

    guest.on('dom-ready', tryInject);
    guest.on('did-navigate', tryInject);
    guest.on('did-navigate-in-page', tryInject);
    guest.on('before-input-event', handleShortcutInput);

    guest.once('destroyed', () => {
        webviewShortcutGuard.delete(webContentsId);
        guest.removeListener('before-input-event', handleShortcutInput);
    });
};

export const registerApplicationEvents = (): void => {
    ipcMain.on("open-url-html", (_event, data: { platform: string; query: string }) => {
        if (!isSafeExternalUrl(data.query)) return;
        openUrlWindow(data.platform, data.query);
    });

    ipcMain.on("open-external", (_event, url: string) => {
        if (!isSafeExternalUrl(url)) return;
        void shell.openExternal(url);
    });

    ipcMain.on("show-webview-context-menu", (event, payload: {
        webContentsId: number;
        currentUrl:    string | null;
        canCopy:       boolean;
        canPaste:      boolean;
    }) => {
        const target = webContents.fromId(payload.webContentsId);
        if (!target) return;

        const ownerWindow      = BrowserWindow.fromWebContents(event.sender) ?? null;
        const currentUrl       = typeof payload.currentUrl === "string" ? payload.currentUrl : null;
        const canUseCurrentUrl = currentUrl !== null && isSafeExternalUrl(currentUrl);

        const saveDialogOptions: Electron.SaveDialogOptions = {
            title:       "Save page as",
            defaultPath: "page.html",
            filters: [
                { name: "Web Page",   extensions: ["html", "htm"] },
                { name: "All Files",  extensions: ["*"] },
            ],
        };

        const menu = Menu.buildFromTemplate([
            { label: "Back",    enabled: target.canGoBack(),    click: () => target.goBack() },
            { label: "Forward", enabled: target.canGoForward(), click: () => target.goForward() },
            { label: "Reload",  click: () => target.reload() },
            { type: "separator" },
            { label: "Copy",  enabled: payload.canCopy,  click: () => target.copy() },
            { label: "Paste", enabled: payload.canPaste, click: () => target.paste() },
            { type: "separator" },
            {
                label:   "Open in New Window",
                enabled: canUseCurrentUrl,
                click:   () => { if (currentUrl) openDirectUrlWindow(currentUrl); },
            },
            {
                label: "Inspect",
                click: () => {
                    try { target.openDevTools({ mode: "detach" }); } catch { /* unavailable */ }
                },
            },
            {
                label:   "Save as...",
                enabled: canUseCurrentUrl,
                click:   async () => {
                    if (!currentUrl) return;
                    const result = ownerWindow
                        ? await dialog.showSaveDialog(ownerWindow, saveDialogOptions)
                        : await dialog.showSaveDialog(saveDialogOptions);
                    if (result.canceled || !result.filePath) return;
                    await target.savePage(result.filePath, "HTMLComplete");
                },
            },
        ]);

        if (ownerWindow) menu.popup({ window: ownerWindow });
        else menu.popup();
    });

    ipcMain.on("register-webview-shortcut", (_event, webContentsId: number) => {
        console.log(`[Webview Shortcut] Registering for ID: ${webContentsId}`);
        registerWebviewShortcut(webContentsId);
    });

    ipcMain.on("load-hist", (event) => {
        event.returnValue = readHistoryStore().history;
    });

    ipcMain.on("save-hist", (_event, history: unknown[]) => {
        const store = readHistoryStore();
        writeHistoryStore(Array.isArray(history) ? history : [], store.activeKey);
    });

    ipcMain.on("load-active", (event) => {
        event.returnValue = readHistoryStore().activeKey;
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

    ipcMain.handle("get-webview-title", (_event, webContentsId: number): string | null => {
        const guest = webContents.fromId(webContentsId);
        return guest?.getTitle() ?? null;
    });

    app.whenReady().then(() => {
        setupSessionHandlers(session.defaultSession);
        setupWebviewPopupGuard();
        void logGpuStatus();
        const win = createMainWindow();

        win.webContents.on("before-input-event", (event, input) => {
            if (input.type !== "keyDown") return;
            const key = String(input.key ?? "").toLowerCase();
            const isCtrlOrMeta = input.control || input.meta;

            const isFindShortcut = isCtrlOrMeta && !input.alt && key === "f";
            const isCloseShortcut = isCtrlOrMeta && !input.alt && key === "w";
            const isNewTabShortcut = isCtrlOrMeta && !input.alt && key === "t";
            const isToggleSettingsShortcut = isCtrlOrMeta && !input.alt && (key === "+" || key === "=" || key === ",");

            if (isFindShortcut || isCloseShortcut || isNewTabShortcut || isToggleSettingsShortcut) {
                console.log(`[Main Window Shortcut] Action: ${isFindShortcut ? 'open-search' : isCloseShortcut ? 'close-tab' : isNewTabShortcut ? 'new-tab' : 'toggle-settings'}`);
                win.webContents.send("webview-shortcut", {
                    action: isFindShortcut ? "open-search" : isCloseShortcut ? "close-tab" : isNewTabShortcut ? "new-tab" : "toggle-settings"
                });
                event.preventDefault();
            }
        });
    });

    app.on("before-quit", () => {
        clearWindowState();
        globalShortcut.unregisterAll();
        const mainWindow = getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.destroy();
    });

    app.on("window-all-closed", () => {
        if (process.platform !== "darwin" && getMainWindow() === null) app.quit();
    });

    app.on("activate", () => {
        if (getMainWindow() === null && BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
};