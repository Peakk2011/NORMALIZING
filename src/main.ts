import { app, BrowserWindow, ipcMain, shell, session } from "electron";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
const rendererUrl = process.env.VITE_DEV_SERVER_URL ??
    pathToFileURL(path.join(__dirname, "renderer/index.html")).toString();
const preloadPath = path.join(__dirname, "preload.js");

app.disableHardwareAcceleration();

app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors");
app.commandLine.appendSwitch("disable-site-isolation-trials");
app.commandLine.appendSwitch("disable-accelerated-2d-canvas");
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");

// 512MB to 256MB
app.commandLine.appendSwitch("js-flags", "--max-old-space-size=256 --max-semi-space-size=1");

app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-gpu-compositing");
app.commandLine.appendSwitch("disable-software-rasterizer");

app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("disable-renderer-backgrounding");

let sessionHandlersSetup = false;

const setupSessionHandlers = (ses: Electron.Session) => {
    if (sessionHandlersSetup) return;
    
    ses.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
        callback({ requestHeaders: details.requestHeaders });
    });

    ses.webRequest.onHeadersReceived((details, callback) => {
        const headers = { ...details.responseHeaders };
        delete headers["x-frame-options"];
        delete headers["X-Frame-Options"];
        callback({ responseHeaders: headers });
    });
    
    sessionHandlersSetup = true;
};

const createWindow = (url: string, width = 600, height = 800) => {
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
            imageAnimationPolicy: "animateOnce" as any,
        },
    });
    
    win.webContents.session.clearCache();
    
    if (isDev) {
        setTimeout(() => {
            if (!win.isDestroyed()) {
                win.webContents.openDevTools({ mode: "detach" });
            }
        }, 500);
    }
    
    win.loadURL(url);
    return win;
};

const MAX_WINDOWS = 3;
let urlViewWindows: Map<string, BrowserWindow> = new Map();

ipcMain.on("open-url-html", (_event, data: { platform: string; query: string }) => {
    const { platform, query } = data;
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
    const newWin = createWindow(urlHtmlUrl, 600, 800);
    
    newWin.on("closed", () => {
        urlViewWindows.delete(windowKey);
    });
    
    urlViewWindows.set(windowKey, newWin);
});

ipcMain.on("open-external", (_event, url: string) => {
    shell.openExternal(url);
});

let mainWindow: BrowserWindow | null = null;

const createMainWindow = () => {
    mainWindow = createWindow(rendererUrl, 600, 800);
    mainWindow.on("closed", () => { 
        mainWindow = null;
        urlViewWindows.clear();
    });
};

app.whenReady().then(() => {
    setupSessionHandlers(session.defaultSession);
    createMainWindow();
});

app.on("before-quit", () => {
    urlViewWindows.clear();
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.destroy();
    }
    session.defaultSession.clearStorageData();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin" && mainWindow === null) {
        app.quit();
    }
});

app.on("activate", () => {
    if (mainWindow === null && BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});

// force garbage collection periodically
setInterval(() => {
    if (global.gc) {
        global.gc();
    }
}, 60000);