/// <reference types="electron" />

import type { Platform } from '../data/usrspace.js';
import mkReqUrl from './mk_req_url.js';
import { Visualizer } from '../../../visualizer/visualizer.js';

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
        __normalizingEnv?: {
            platform: string;
            runtime: string;
            isElectron: boolean;
            isWeb: boolean;
            isDev: boolean;
        };
    }
}

const search = (platform: Platform): void => {
    const input = document.getElementById('queryInput') as HTMLTextAreaElement | null;
    if (!input) return;

    const query = input.value;
    if (!query.trim()) {
        void Visualizer({ title: 'Type your message and select your platform.' });
        return;
    }

    const url = mkReqUrl(platform, query);
    if (!url) return;

    const env = (window.env as any) ?? (window as any).__normalizingEnv;
    if (env?.isWeb) {
        // Direct redirect for web browsers
        window.location.href = url;
    } else {
        // Navigate to url.html for Electron
        const urlHtmlUrl = `${window.location.origin}/url.html?platform=${encodeURIComponent(platform)}&query=${encodeURIComponent(query)}`;
        window.location.href = urlHtmlUrl;
    }
};

export default search