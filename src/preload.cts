const { contextBridge, ipcRenderer } = require("electron")

// detect platform from userAgent
const ua = navigator.userAgent.toLowerCase()

const isMac = ua.includes("mac")
const isWindows = ua.includes("win")
const isLinux = ua.includes("linux")

// detect electron runtime
const isElectron =
    typeof process !== "undefined" &&
    process.versions &&
    !!process.versions.electron

const platform =
    isMac ? "mac" :
    isWindows ? "windows" :
    isLinux ? "linux" : "unknown"

const runtime = isElectron ? "electron" : "web"

const isDev =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1"

// inject css class to html immediately
// REMOVED: DOM manipulation in preload is not allowed

// markers for bridge communication
const rendererBridgeMarker = "__normalizing_renderer_console_bridge__"
const openExternalRequestMarker = "__normalizing_open_external__"

// console methods we want to capture
const consoleMethods = ["debug", "log", "info", "warn", "error"] as const
type ConsoleMethod = typeof consoleMethods[number]

// convert unsafe values into safe json
const serialize = (value: unknown): unknown => {
    if (value instanceof Error) {
        return {
            name: value.name,
            message: value.message,
            stack: value.stack,
        }
    }

    if (typeof value === "bigint") return value.toString()
    if (typeof value === "function") return `[function ${value.name || "anonymous"}]`

    try {
        return JSON.parse(JSON.stringify(value))
    } catch {
        return String(value)
    }
}

// send logs to main process
const sendLog = (source: "renderer" | "preload", method: ConsoleMethod, args: unknown[]) => {
    try {
        ipcRenderer.send("renderer-log", {
            source,
            method,
            args: args.map(serialize),
        })
    } catch {}
}

// expose electron api to renderer
contextBridge.exposeInMainWorld("electronAPI", {
    openExternal: (url: string) => {
        ipcRenderer.send("open-external", url)
    },
    openUrlHtml: (platform: string, query: string) => {
        ipcRenderer.send("open-url-html", { platform, query })
    },
})

// expose env info to renderer
contextBridge.exposeInMainWorld("env", {
    platform,
    runtime,
    isElectron,
    isWeb: !isElectron,
    isDev,
})

// patch console in preload
for (const method of consoleMethods) {
    const original = console[method].bind(console)

    console[method] = (...args: any[]) => {
        sendLog("preload", method, args)
        original(...args)
    }
}

// optional renderer console bridge
if (typeof contextBridge.executeInMainWorld === "function") {
    try {
        contextBridge.executeInMainWorld({
            func: (methods: string[], marker: string) => {
                const w = window as any

                if (w[marker]) return
                w[marker] = true

                const safe = (v: unknown) => {
                    if (v instanceof Error) {
                        return {
                            name: v.name,
                            message: v.message,
                            stack: v.stack,
                        }
                    }

                    if (typeof v === "bigint") return v.toString()
                    if (typeof v === "function") return `[function ${v.name || "anonymous"}]`

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
                        window.postMessage(
                            {
                                [marker]: true,
                                method: m,
                                args: args.map(safe),
                            },
                            "*",
                        )

                        return original.apply(console, args)
                    }
                }
            },
            args: [consoleMethods as unknown as string[], rendererBridgeMarker],
        })
    } catch {}
}

// message bridge from renderer
window.addEventListener("message", (event) => {
    if (event.source !== window) return

    const data = event.data
    if (!data) return

    const openUrl = data[openExternalRequestMarker]
    if (typeof openUrl === "string") {
        ipcRenderer.send("open-external", openUrl)
        return
    }

    if (data[rendererBridgeMarker] !== true) return

    const method = data.method
    const args = Array.isArray(data.args) ? data.args : []

    sendLog("renderer", method, args)
})

// preload ready signal
ipcRenderer.send("preload-ready")

console.log("preload loaded")
console.log("platform =", platform)

/*
.platform-mac body {}
.platform-windows body {}
.runtime-electron {}
.runtime-web {}
*/