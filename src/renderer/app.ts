/// <reference types="electron" />

import normalize from './normalize.js';
import initMenu from './impl/io/menu.js';
import initInput from './impl/io/input.js';
import initBtn from './impl/io/btn.js';
import initSidebar from './impl/io/sidebar.js';
import initSubstrate from './impl/hijack/substrate.js';
import { mountSidebarParts } from './impl/io/sidebar_parts.js';
import type { NormalizingEnv } from './types/window.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('app.ts loaded, electronAPI:', window.electronAPI);
    mountSidebarParts();

    // Inject platform classes
    const root = document.documentElement;
    
    const env: NormalizingEnv = window.env ?? window.__normalizingEnv ?? {
        platform: navigator.userAgent.toLowerCase().includes("win") ? "windows"
                : navigator.userAgent.toLowerCase().includes("mac") ? "mac"
                : navigator.userAgent.toLowerCase().includes("linux") ? "linux"
                : "unknown",
        runtime: "web",
        isElectron: false,
        isWeb: true,
        isDev: location.hostname === "localhost" || location.hostname === "127.0.0.1",
    };

    const setWindowEnv = (value: typeof env) => {
        const desc = Object.getOwnPropertyDescriptor(window, 'env');
        if (!desc || desc.writable) {
            try {
                window.env = value;
                return;
            } catch {
                // fallback below
            }
        }
        if (desc?.configurable) {
            Object.defineProperty(window, 'env', {
                value,
                writable: true,
                configurable: true,
                enumerable: true,
            });
            return;
        }
        window.__normalizingEnv = value;
    };

    setWindowEnv(env);

    root.classList.add(`platform-${env.platform}`);
    root.classList.add(`runtime-${env.runtime}`);
    root.classList.add(env.isDev ? "env-dev" : "env-prod");

    console.log('window.env:', window.env);

    void normalize;

    initMenu();
    initInput();
    initBtn();
    initSidebar();
    initSubstrate();
});