const { contextBridge, ipcRenderer }
    = require("electron") as typeof import("electron");

import { consoleMethods, type ConsoleMethod } from "./console/c0_rt.js";
import serialize from "./console/c1_rt.js";
import installPreloadConsole from "./console/c2_bind.js";
import { OPEN_EXTERNAL_MARKER, RENDERER_BRIDGE_MARKER } from "./bridge/b0_rt.js";
import installRendererConsoleBridge from "./bridge/b1_bind.js";
import setupMessageRelay from "./bridge/b2_bind.js";
import detectEnv from "./env/e0_rt.js";
import exposeApi from "./env/e1_bind.js";
import exposeEnv from "./env/e2_bind.js";

const sendLog = (source: "renderer" | "preload", method: ConsoleMethod, args: unknown[]): void => {
    try {
        ipcRenderer.send("renderer-log", { source, method, args: args.map(serialize) });
    } catch {
        // ignore log relay failures
    }
};

export const preload_init = (): void => {
    const platformStr = process.platform === 'darwin' ? 'Macintosh; Intel Mac OS X 10_15_7' :
                        process.platform === 'linux' ? 'X11; Linux x86_64' :
                        'Windows NT 10.0; Win64; x64';
    const ua = `Mozilla/5.0 (${platformStr}) AppleWebKit/537.36 (KHTML, like Gecko) Normalizing/1.0.0 Safari/537.36`;

    // Override navigator properties to reflect Normalizing
    Object.defineProperty(navigator, 'userAgent', {
        value: ua,
        writable: false,
        configurable: false
    });

    Object.defineProperty(navigator, 'appName', {
        value: 'Normalizing',
        writable: false,
        configurable: false
    });

    const env = detectEnv();

    Object.defineProperty(navigator, 'appVersion', {
        value: `5.0 (${platformStr}) AppleWebKit/537.36 (KHTML, like Gecko) Normalizing/1.0.0 Safari/537.36`,
        writable: false,
        configurable: false
    });

    installPreloadConsole(consoleMethods, sendLog);
    installRendererConsoleBridge(
        contextBridge,
        consoleMethods,
        RENDERER_BRIDGE_MARKER
    );
    
    setupMessageRelay(
        ipcRenderer,
        RENDERER_BRIDGE_MARKER,
        OPEN_EXTERNAL_MARKER,
        sendLog
    );

    exposeApi(contextBridge, ipcRenderer);
    exposeEnv(contextBridge, env);

    // Override navigator properties to reflect Normalizing
    Object.defineProperty(navigator, 'appName', {
        value: 'Normalizing',
        writable: false,
        configurable: false
    });

    const platform = env.platform === 'darwin' ? 'Macintosh; Intel Mac OS X 10_15_7' :
                     env.platform === 'linux' ? 'X11; Linux x86_64' :
                     'Windows NT 10.0; Win64; x64';
    Object.defineProperty(navigator, 'appVersion', {
        value: `5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Normalizing/1.0.0 Safari/537.36`,
        writable: false,
        configurable: false
    });

    ipcRenderer.send("preload-ready");

    console.log("preload loaded");
    console.log("platform =", env.platform);
    console.log("runtime  =", env.runtime);
};

export default { preload_init };