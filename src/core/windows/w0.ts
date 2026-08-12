import type { BrowserWindow } from "electron";
import { rendererUrl } from "../config/env.js";

import {
    createWindow,
    refreshOverlay as refreshOverlayImpl,
    setPopupUrlOpener,
    setupWebviewPopupGuard as setupWebviewPopupGuardImpl
} from "./w0_new.js";

const MAX_WINDOWS = 3;

let mainWindow: BrowserWindow | null = null;
const urlViewWindows = new Map<string, BrowserWindow>();

export const openUrlWindow = (platform: string, query: string): void => {
    const windowKey = `${platform}-${query}`;
    const existingWin = urlViewWindows.get(windowKey);

    if (existingWin && !existingWin.isDestroyed()) {
        existingWin.focus();
        return;
    }

    if (urlViewWindows.size >= MAX_WINDOWS) {
        const oldestKey = urlViewWindows.keys().next().value;
        if (oldestKey) {
            const oldestWin = urlViewWindows.get(oldestKey);
            if (oldestWin && !oldestWin.isDestroyed()) {
                oldestWin.close();
            }
            urlViewWindows.delete(oldestKey);
        }
    }

        const windowBounds = mainWindow && !mainWindow.isDestroyed()
        ? mainWindow.getBounds()
        : { width: 520, height: 615 };

    const targetUrl = new URL("url.html", rendererUrl);
    if (platform === 'direct') {
        targetUrl.searchParams.set("target", query);
    } else {
        targetUrl.searchParams.set("platform", platform);
        targetUrl.searchParams.set("query", query);
    }
    const newWin = createWindow(targetUrl.toString(), windowBounds.width, windowBounds.height);

    newWin.on("closed", () => {
        urlViewWindows.delete(windowKey);
    });

    urlViewWindows.set(windowKey, newWin);
};

export const openDirectUrlWindow = (url: string): void => {
    openUrlWindow('direct', url);
};

setPopupUrlOpener(openDirectUrlWindow);

export const createMainWindow = (): BrowserWindow => {
    const win = createWindow(rendererUrl, 520, 615);
    mainWindow = win;
    win.on("closed", () => {
        mainWindow = null;
        urlViewWindows.clear();
    });
    return win;
};

export const getMainWindow = (): BrowserWindow | null => mainWindow;

export const refreshOverlay = refreshOverlayImpl;

export const setupWebviewPopupGuard = setupWebviewPopupGuardImpl;

export const clearWindowState = (): void => {
    urlViewWindows.clear();
};