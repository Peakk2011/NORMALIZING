import path from "node:path";

import type {
    BrowserWindow as ElectronBrowserWindow,
    BrowserWindowConstructorOptions,
    TitleBarOverlayOptions
} from "electron";

import { BrowserWindow, nativeImage, nativeTheme } from "electron";
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

export const createWindow = (url: string, width = 900, height = 780): ElectronBrowserWindow => {
    const windowOptions: BrowserWindowConstructorOptions = {
        width,
        height,
        show: true,
        backgroundColor: "#00ffffff",
        titleBarStyle: "hidden",
        titleBarOverlay: getTitleBarOverlay(),
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
    win.setMenuBarVisibility(false);
    win.removeMenu();

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
        return {
            action: "allow",
            overrideBrowserWindowOptions: {
                autoHideMenuBar: true,
                titleBarStyle: "hidden",
                titleBarOverlay: getTitleBarOverlay(),
                backgroundColor: "#00ffffff",
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
        webPreferences.nodeIntegration = false;
        webPreferences.contextIsolation = true;
        webPreferences.sandbox = true;
        webPreferences.webSecurity = true;
        webPreferences.allowRunningInsecureContent = false;
    });

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