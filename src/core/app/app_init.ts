import { app } from "electron";
import { configureApplicationRuntime } from "../config/env.js";
import { registerApplicationEvents } from "./app_evt_hook.js";

export const createApplication = (): void => {
    app.commandLine.appendSwitch("enable-gpu-rasterization");
    app.commandLine.appendSwitch("ignore-gpu-blocklist");

    configureApplicationRuntime();
    registerApplicationEvents();
};

export default createApplication;