import path from "node:path";
import wait from '../../api/wait.js';

import type {
    BrowserWindow as ElectronBrowserWindow,
    BrowserWindowConstructorOptions,
    TitleBarOverlayOptions
} from "electron";

import { app, BrowserWindow, nativeImage, nativeTheme } from "electron";
import { isDev, preloadPath } from "../config/env.js";

// Resolve the correct icon format per platform
const getIconPath = (): string => {
    const base = isDev
        ? path.resolve(process.cwd(), "assets", "logo", "app_icons")
        : path.join(process.resourcesPath, "assets", "logo", "app_icons");
    if (process.platform === "darwin") return path.join(base, "application_icon.icns");
    if (process.platform === "win32") return path.join(base, "application_icon.ico");
    return path.join(base, "application_icon.png");
};

const isHttpUrl = (value: string): boolean => {
    try {
        const parsed = new URL(value);
        return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
        return false;
    }
};

const getTitleBarOverlay = (): TitleBarOverlayOptions => ({
    color: "#ffffff00",
    symbolColor: nativeTheme.shouldUseDarkColors ? "#ffffff" : "#000000",
    height: 38,
});

const titlebarOverlayWin = (win: ElectronBrowserWindow): void => {
    if (!win.isDestroyed()) {
        win.setTitleBarOverlay(getTitleBarOverlay());
    }
};

export const refreshOverlay = (): void => {
    BrowserWindow.getAllWindows().forEach(titlebarOverlayWin);
};

// Popup routing
type PopupUrlOpener = (targetUrl: string) => void;

let popupUrlOpener: PopupUrlOpener | null = null;

export const setPopupUrlOpener = (opener: PopupUrlOpener): void => {
    popupUrlOpener = opener;
};

const routePopupUrl = (targetUrl: string): void => {
    if (!isHttpUrl(targetUrl)) return;

    if (popupUrlOpener) {
        popupUrlOpener(targetUrl);
    } else {
        console.warn("[popup] popupUrlOpener not set");
        createWindow(targetUrl);
    }
};

// (popup / target="_blank" / window.open() / <webview allowpopups>)
let webviewPopupGuardInstalled = false;

export const setupWebviewPopupGuard = (): void => {
    if (webviewPopupGuardInstalled) return;
    webviewPopupGuardInstalled = true;

    app.on("web-contents-created", (_event, contents) => {
        if (contents.getType() !== "webview") return;

        contents.setWindowOpenHandler(({ url: targetUrl }) => {
            routePopupUrl(targetUrl);
            return { action: "deny" };
        });

        contents.on("will-navigate", (event, targetUrl) => {
            if (!isHttpUrl(targetUrl)) {
                event.preventDefault();
            }
        });
    });
};

export const createWindow = (url: string, width = 520, height = 615): ElectronBrowserWindow => {
    const windowOptions: BrowserWindowConstructorOptions = {
        width,
        height,
        show: false,
        frame: false,
        backgroundColor: "#00ffffff",
        titleBarStyle: "hidden",
        titleBarOverlay: getTitleBarOverlay(),
        autoHideMenuBar: false,
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
    win.setMenuBarVisibility(false);
    win.removeMenu();

    win.once("ready-to-show", () => {
        if (!win.isDestroyed()) win.show();
    });

    const syncTitleBarOverlay = (): void => {
        if (!win.isDestroyed()) {
            win.setTitleBarOverlay(getTitleBarOverlay());
        }
    };
    nativeTheme.on("updated", syncTitleBarOverlay);
    win.on("closed", () => {
        nativeTheme.removeListener("updated", syncTitleBarOverlay);
    });

    win.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
        if (!isHttpUrl(targetUrl)) {
            return { action: "deny" };
        }

        routePopupUrl(targetUrl);
        return {
            action: "deny",
            overrideBrowserWindowOptions: {
                frame: false,
                autoHideMenuBar: false,
                titleBarStyle: "hidden",
                titleBarOverlay: getTitleBarOverlay(),
                backgroundColor: "#ffffff",
                show: false,
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
            },
        };
    });

    win.webContents.on("did-create-window", (childWindow) => {
        childWindow.setMenuBarVisibility(false);
        childWindow.removeMenu();
    });

    win.webContents.on("will-attach-webview", (event, webPreferences, params) => {
        const targetUrl = typeof params.src === "string" ? params.src : "";
        if (!isHttpUrl(targetUrl)) {
            event.preventDefault();
            return;
        }

        delete webPreferences.preload;
        webPreferences.nodeIntegration = true;
        webPreferences.contextIsolation = false;
        webPreferences.sandbox = false;
        webPreferences.webSecurity = true;
        webPreferences.allowRunningInsecureContent = false;
    });

    // Open detached DevTools only in development
    if (isDev) {
        void wait(500).then(() => {
            if (!win.isDestroyed()) {
                win.webContents.openDevTools({ mode: "detach" });
            }
        });
    }

    void win.loadURL(url);
    return win;
};