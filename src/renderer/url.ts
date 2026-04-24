/// <reference types="electron" />

import type { Platform } from './impl/data/usrspace.js';
import mkReqUrl from './impl/search/mk_req_url.js';

declare global {
    interface Window {
        electronAPI?: {
            openExternal: (url: string) => void;
            openUrlHtml: (platform: string, query: string) => void;
        };
    }
}

// Detect platform and add CSS classes
const ua = navigator.userAgent.toLowerCase();
const isMac = ua.includes("mac");
const isWindows = ua.includes("win");
const isLinux = ua.includes("linux");
const platform = isMac ? "mac" : isWindows ? "windows" : isLinux ? "linux" : "unknown";
const isDev = location.hostname === "localhost" || location.hostname === "127.0.0.1";

document.documentElement.classList.add(`platform-${platform}`);
document.documentElement.classList.add(`runtime-electron`);
document.documentElement.classList.add(isDev ? "env-dev" : "env-prod");

interface SearchData {
    platform: Platform;
    query: string;
    url: string;
}

const validPlatforms: Platform[] = ['google', 'youtube', 'threads', 'facebook', 'pinterest', 'github', 'instagram'];

function isValidPlatform(platform: string): platform is Platform {
    return validPlatforms.includes(platform as Platform);
}

let currentData: SearchData | null = null;

const parseSearchData = (): SearchData | null => {
    const params = new URLSearchParams(window.location.search);
    const platformParam = params.get('platform');
    const query = params.get('query');

    if (!platformParam || !query || !isValidPlatform(platformParam)) return null;

    const url = mkReqUrl(platformParam, query);
    if (!url) return null;

    return { platform: platformParam, query, url };
};

const openUrl = (url: string): void => {
    if (window.electronAPI?.openExternal) {
        window.electronAPI.openExternal(url);
    } else {
        window.open(url, '_blank');
    }
};

const loadResult = (url: string): void => {
    const webview = document.getElementById('resultFrame') as Electron.WebviewTag | null;
    if (!webview) {
        console.error('Webview element not found');
        openUrl(url); // Fallback
        return;
    }

    webview.addEventListener('did-fail-load', (e: any) => {
        console.error('Failed to load URL in webview:', e.errorDescription);
        openUrl(url); // Fallback
    });

    webview.src = url;
};

const goBack = (): void => {
    window.location.href = 'index.html';
};

const searchAgain = (platform: Platform): void => {
    if (!currentData) return;

    const url = mkReqUrl(platform, currentData.query);
    if (url) {
        loadResult(url);
        currentData = { ...currentData, platform, url };
    }
};

const initHeader = (): void => {
    const searchTitle = document.getElementById('searchTitle');
    if (searchTitle && currentData) {
        searchTitle.textContent = currentData.query;
        searchTitle.title = currentData.query;
    }
};

const initMenu = (): void => {
    const menuBtn = document.getElementById('menuBtn');
    const platformMenu = document.getElementById('platformMenu');

    if (!menuBtn || !platformMenu) return;

    const onMenuClick = (e: Event) => {
        e.stopPropagation();
        platformMenu.classList.toggle('hidden');
    };

    const onDocumentClick = (e: Event) => {
        if (!platformMenu.contains(e.target as Node)) {
            platformMenu.classList.add('hidden');
        }
    };

    const onPlatformClick = (e: Event) => {
        const button = (e.target as HTMLElement).closest('button');
        if (!button) return;

        const platform = button.getAttribute('data-platform');
        if (!platform || !isValidPlatform(platform)) return;

        searchAgain(platform);
        platformMenu.classList.add('hidden');
    };

    menuBtn.addEventListener('click', onMenuClick);
    document.addEventListener('click', onDocumentClick);
    platformMenu.addEventListener('click', onPlatformClick);

    // Cleanup on unload
    window.addEventListener('beforeunload', () => {
        menuBtn.removeEventListener('click', onMenuClick);
        document.removeEventListener('click', onDocumentClick);
        platformMenu.removeEventListener('click', onPlatformClick);
    });
};

document.addEventListener('DOMContentLoaded', () => {
    currentData = parseSearchData();

    if (!currentData) {
        console.warn('No search data found in URL params');
        return;
    }

    loadResult(currentData.url);

    initHeader();

    const backBtn = document.getElementById('backBtn');
    backBtn?.addEventListener('click', goBack);

    initMenu();
});