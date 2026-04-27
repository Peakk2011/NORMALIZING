/// <reference types="electron" />

import type { Platform } from './impl/data/usrspace.js';
import mkReqUrl from './impl/search/mk_req_url.js';
import initSidebar from './impl/io/sidebar.js';
import { mountSidebarParts } from './impl/io/sidebar_parts.js';
import type { NormalizingEnv } from './types/window.js';

const ua = navigator.userAgent.toLowerCase();
const isMac     = ua.includes("mac");
const isWindows = ua.includes("win");
const isLinux   = ua.includes("linux");
const isElectron = ua.includes("electron");

const env: NormalizingEnv = window.env ?? window.__normalizingEnv ?? {
    platform:   isMac ? "mac" : isWindows ? "windows" : isLinux ? "linux" : "unknown",
    runtime:    isElectron ? "electron" : "web",
    isElectron: isElectron,
    isWeb:      !isElectron,
    isDev:      location.hostname === "localhost" || location.hostname === "127.0.0.1",
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

document.documentElement.classList.add(`platform-${env.platform}`);
document.documentElement.classList.add(`runtime-${env.runtime}`);
document.documentElement.classList.add(env.isDev ? "env-dev" : "env-prod");

interface SearchData {
    platform: Platform | null;
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
    const target = params.get('target');

    if (target) {
        const url = makeHref(target);
        return { platform: null, query: query ?? target, url };
    }

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
    if (env.isWeb) {
        window.location.href = url;
        return;
    }

    const webview = document.getElementById('resultFrame') as Electron.WebviewTag | null;
    if (!webview) {
        openUrl(url);
        return;
    }

    webview.addEventListener('did-fail-load', () => {
        openUrl(url);
    });

    webview.src = url;
};

const goBack = (): void => {
    if (env.isWeb) {
        if (window.history.length > 1) {
            window.history.back();
            return;
        }
        window.location.href = 'index.html';
        return;
    }

    const webview = document.getElementById('resultFrame') as Electron.WebviewTag | null;
    if (webview?.canGoBack()) {
        webview.goBack();
        return;
    }

    window.location.href = 'index.html';
};

const searchAgain = (platform: Platform): void => {
    if (!currentData) return;

    if (isLikelyUrl(currentData.query)) {
        const url = makeHref(currentData.query);
        loadResult(url);
        currentData = { ...currentData, platform: null, url };
        return;
    }

    const url = mkReqUrl(platform, currentData.query);
    if (url) {
        loadResult(url);
        currentData = { ...currentData, platform, url };
    }
};

const isLikelyUrl = (value: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) return false;

    const schemePattern = /^[a-z][a-z\d+\-.]*:\/\//i;
    const hostPattern = /^(?:[\w-]+\.)+[a-z]{2,}(?:[:/].*)?$/i;
    return schemePattern.test(trimmed) || hostPattern.test(trimmed);
};

const makeHref = (value: string): string => {
    const trimmed = value.trim();
    if (/^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed)) {
        return trimmed;
    }
    if (/^\/\//.test(trimmed)) {
        return `https:${trimmed}`;
    }
    return `https://${trimmed}`;
};

const initHeader = (): void => {
    const searchTitle = document.getElementById('searchTitle') as HTMLInputElement | null;
    if (!searchTitle || !currentData) return;

    searchTitle.value = currentData.query;
    searchTitle.title = currentData.query;

    const updateUrlStyle = (): void => {
        if (isLikelyUrl(searchTitle.value)) {
            searchTitle.classList.add('url-detected');
        } else {
            searchTitle.classList.remove('url-detected');
        }
    };

    const performSearch = (): void => {
        const query = searchTitle.value.trim();
        if (!query || !currentData) return;

        currentData = { ...currentData, query };
        const directUrl = isLikelyUrl(query);
        const nextPlatform = directUrl ? null : (currentData.platform ?? 'google');
        const url = directUrl
            ? makeHref(query)
            : mkReqUrl(nextPlatform as Platform, query);
        if (url) {
            currentData = { ...currentData, platform: nextPlatform, url };
            loadResult(url);
            searchTitle.title = query;
        }
    };

    searchTitle.addEventListener('input', updateUrlStyle);
    searchTitle.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            performSearch();
        }
    });
};

const initMenu = (): void => {
    const menuBtn      = document.getElementById('menuBtn');
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
    mountSidebarParts();
    initSidebar();
    currentData = parseSearchData();

    if (!currentData) return;

    loadResult(currentData.url);

    initHeader();

    const backBtn = document.getElementById('backBtn');
    backBtn?.addEventListener('click', goBack);

    initMenu();
});