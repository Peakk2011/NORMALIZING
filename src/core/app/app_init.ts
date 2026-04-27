import { createRequire } from "node:module";
import path from "node:path";
import { configureApplicationRuntime } from "../config/env.js";
import { registerApplicationEvents } from "./app_evt_hook.js";

const requireFromAppRoot = createRequire(path.resolve(process.cwd(), "package.json"));
const { app } = requireFromAppRoot("electron") as typeof import("electron");

const configureCommandLine = (): void => {
    app.disableHardwareAcceleration();

    app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors");
    app.commandLine.appendSwitch("disable-site-isolation-trials");
    app.commandLine.appendSwitch("disable-accelerated-2d-canvas");
    app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");
    app.commandLine.appendSwitch("js-flags", "--max-old-space-size=256 --max-semi-space-size=1");
    app.commandLine.appendSwitch("disable-gpu");
    app.commandLine.appendSwitch("disable-gpu-compositing");
    app.commandLine.appendSwitch("disable-software-rasterizer");
    app.commandLine.appendSwitch("disable-background-timer-throttling");
    app.commandLine.appendSwitch("disable-renderer-backgrounding");
};

const startGarbageCollectionLoop = (): void => {
    setInterval(() => {
        if (global.gc) {
            global.gc();
        }
    }, 60000);
};

export const createApplication = (): void => {
    configureApplicationRuntime();
    configureCommandLine();
    registerApplicationEvents();
    startGarbageCollectionLoop();
};

export default createApplication;
