const { contextBridge, ipcRenderer } = require("electron");

const ua = navigator.userAgent.toLowerCase();

const isMac     = ua.includes("mac");
const isWindows = ua.includes("win");
const isLinux   = ua.includes("linux");

/*
    Electron always injects "Electron/x.x.x" into the User-Agent string.
    Checking process.versions.electron is unreliable here because preload
    scripts always run inside Electron's renderer process — so that flag
    would be true even when the app is opened as a plain web page in a browser.
*/
const isElectron = ua.includes("electron");

const platform = isMac ? "mac" : isWindows ? "windows" : isLinux ? "linux" : "unknown";
const runtime  = isElectron ? "electron" : "web";
const isDev    = location.hostname === "localhost" || location.hostname === "127.0.0.1";

const consoleMethods = [
    "debug",
    "log",
    "info",
    "warn",
    "error"
] as const;

type ConsoleMethod = typeof consoleMethods[number];

// Serialize values that are not safely JSON-serializable
const serialize = (value: unknown): unknown => {
    if (value instanceof Error) {
        return {
            name: value.name,
            message: value.message,
            stack: value.stack
        }
    }
    if (typeof value === "bigint")   return value.toString()
    if (typeof value === "function") return `[function ${value.name || "anonymous"}]`
    try {
        return JSON.parse(JSON.stringify(value))
    } catch {
        return String(value)
    }
}

// Forward logs from renderer/preload to the main process
const sendLog = (source: "renderer" | "preload", method: ConsoleMethod, args: unknown[]) => {
    try {
        ipcRenderer.send("renderer-log", { source, method, args: args.map(serialize) })
    } catch {}
}

// Patch console in preload context
for (const method of consoleMethods) {
    const original = console[method].bind(console)
    console[method] = (...args: any[]) => {
        sendLog("preload", method, args)
        original(...args)
    }
}

const RENDERER_BRIDGE_MARKER  = "__normalizing_renderer_console_bridge__"
const OPEN_EXTERNAL_MARKER    = "__normalizing_open_external__"

// Attempt the executeInMainWorld approach (Electron 20+)
if (typeof contextBridge.executeInMainWorld === "function") {
    try {
        contextBridge.executeInMainWorld({
            func: (methods: string[], marker: string) => {
                const w = window as any
                if (w[marker]) return
                w[marker] = true

                const safe = (v: unknown): unknown => {
                    if (v instanceof Error) {
                        return {
                            name: v.name,
                            message: v.message,
                            stack: v.stack
                        }
                    }
                    if (typeof v === "bigint")   return v.toString()
                    if (typeof v === "function") return `[function ${(v as Function).name || "anonymous"}]`
                    try {
                        return JSON.parse(JSON.stringify(v))
                    } catch {
                        return String(v)
                    }
                }

                for (const m of methods) {
                    const original = (console as any)[m]
                    if (typeof original !== "function") continue

                    ;(console as any)[m] = (...args: any[]) => {
                        window.postMessage({ [marker]: true, method: m, args: args.map(safe) }, "*")
                        return original.apply(console, args)
                    }
                }
            },
            args: [consoleMethods as unknown as string[], RENDERER_BRIDGE_MARKER],
        })
    } catch {}
}

// postMessage relay -> receives messages from the renderer console patch above
// and from any renderer code that manually posts an openExternalRequestMarker.
window.addEventListener("message", (event) => {
    if (event.source !== window) return
    const data = event.data
    if (!data) return

    const openUrl = data[OPEN_EXTERNAL_MARKER]

    if (typeof openUrl === "string") {
        ipcRenderer.send("open-external", openUrl)
        return
    }

    if (data[RENDERER_BRIDGE_MARKER] !== true) return

    const method = data.method;
    const args   = Array.isArray(data.args) ? data.args : [];
    sendLog("renderer", method, args);
})

contextBridge.exposeInMainWorld("electronAPI", {
    openExternal: (url: string) => ipcRenderer.send("open-external", url),
    openUrlHtml:  (platform: string, query: string) => ipcRenderer.send("open-url-html", { platform, query }),
})

contextBridge.exposeInMainWorld("env", {
    platform,
    runtime,
    isElectron,
    isWeb: !isElectron,
    isDev,
})

ipcRenderer.send("preload-ready");

console.log("preload loaded");
console.log("platform =", platform);
console.log("runtime  =", runtime);

/*
CSS class hints for the renderer (applied by renderer, not preload):
  .platform-mac     body {}
  .platform-windows body {}
  .platform-linux   body {}
  .runtime-electron {}
  .runtime-web      {}
*/