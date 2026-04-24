/// <reference types="electron" />

import normalize from './normalize.js';
import initMenu from './impl/io/menu.js';
import initInput from './impl/io/input.js';
import initBtn from './impl/io/btn.js';
import initSubstrate from './impl/hijack/substrate.js';

declare global {
    interface Window {
        electronAPI?: {
            openExternal: (url: string) => void;
            openUrlHtml: (platform: string, query: string) => void;
        };
        env?: {
            platform: string;
            runtime: string;
            isElectron: boolean;
            isWeb: boolean;
            isDev: boolean;
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('app.ts loaded, electronAPI:', (window as any).electronAPI);

    // Inject platform classes
    const root = document.documentElement;
    const env = window.env;
    if (env) {
        root.classList.add(`platform-${env.platform}`);
        root.classList.add(`runtime-${env.runtime}`);
        if (env.isDev) root.classList.add("env-dev");
        else root.classList.add("env-prod");
    }

    void normalize;

    initMenu();
    initInput();
    initBtn();
    initSubstrate();
});