import { pathToFileURL } from "node:url";
import path from "node:path";

const distDir = path.resolve(process.cwd(), "dist");

export const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
export const rendererUrl = process.env.VITE_DEV_SERVER_URL
    ?? pathToFileURL(path.join(distDir, "renderer/index.html")).toString();
export const preloadPath = path.join(distDir, "preload.js");

export const configureApplicationRuntime = (): void => {
    process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";
};