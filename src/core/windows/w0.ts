import type { BrowserWindow } from "electron";
import { rendererUrl } from "../config/env.js";
import { createWindow, refreshOverlay as refreshOverlayImpl } from "./w0_new.js";

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

    const urlHtmlUrl = `${rendererUrl.replace("index.html", "url.html")}?platform=${encodeURIComponent(platform)}&query=${encodeURIComponent(query)}`;
    const newWin = createWindow(urlHtmlUrl, 900, 780);

    newWin.on("closed", () => {
        urlViewWindows.delete(windowKey);
    });

    urlViewWindows.set(windowKey, newWin);
};

export const openDirectUrlWindow = (url: string): void => {
    const newWin = createWindow(url, 900, 780);
    newWin.on("closed", () => {
        for (const [key, value] of urlViewWindows.entries()) {
            if (value === newWin) {
                urlViewWindows.delete(key);
            }
        }
    });
};

export const createMainWindow = (): BrowserWindow => {
    const win = createWindow(rendererUrl, 900, 780);
    mainWindow = win;
    win.on("closed", () => {
        mainWindow = null;
        urlViewWindows.clear();
    });
    return win;
};

export const getMainWindow = (): BrowserWindow | null => mainWindow;

export const refreshOverlay = refreshOverlayImpl;

export const clearWindowState = (): void => {
    urlViewWindows.clear();
};