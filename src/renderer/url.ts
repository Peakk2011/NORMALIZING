/// <reference types="electron" />

import type { Platform } from './impl/data/usrspace.js';
import mkReqUrl from './impl/search/mk_req_url.js';
import { isLikelyUrl, makeHref, recordSearchHistory } from './impl/search/search.js';
import initSidebar from './impl/io/sidebar.js';
import { mountSidebarParts } from './impl/io/sidebar_parts.js';
import { initTheme } from './impl/io/theme.js';
import { getDefaultPlatform } from './impl/io/settings.js';
import type { NormalizingEnv } from './types/window.js';
import { Visualizer } from '../visualizer/visualizer.js';

const ua = navigator.userAgent.toLowerCase();
const isMac     = ua.includes("mac");
const isWindows = ua.includes("win");
const isLinux   = ua.includes("linux");
const isElectron = Boolean(window.electronAPI) || ua.includes("electron");

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
document.documentElement.classList.add("page-url");
initTheme();

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
let activeWebview: Electron.WebviewTag | null = null;
let pendingExternalUrl: string | null = null;

const getUrlErrorMessage = (query: string, detail?: string, errorCode?: number): string => {
    if (errorCode === -118) {
        return `Connection timed out while opening:\n${query}`;
    }

    if (errorCode === -106) {
        return `No internet connection.\nUnable to open:\n${query}`;
    }

    if (detail) {
        return `${query}\n${detail}`;
    }

    return query;
};

const showUrlError = async (query: string, detail?: string): Promise<void> => {
    await Visualizer({
        title: 'This URL could not be opened.',
        message: getUrlErrorMessage(query, detail),
    });
    window.location.href = 'index.html';
};

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

const getCurrentUrl = (): string | null => {
    if (activeWebview && typeof activeWebview.getURL === 'function') {
        const liveUrl = activeWebview.getURL();
        if (liveUrl) return liveUrl;
    }
    if (!currentData) return null;
    return currentData.url;
};

const setRefreshLoadingState = (isLoading: boolean): void => {
    const refreshBtn = document.getElementById('refresh-btn') as HTMLButtonElement | null;
    if (!refreshBtn) return;

    refreshBtn.classList.toggle('is-loading', isLoading);
    refreshBtn.disabled = isLoading;
    refreshBtn.setAttribute('aria-busy', String(isLoading));
};

const initWebview = (webview: Electron.WebviewTag): void => {
    if (activeWebview === webview) return;
    activeWebview = webview;

    webview.addEventListener('did-start-loading', () => {
        setRefreshLoadingState(true);
    });

    webview.addEventListener('did-stop-loading', () => {
        setRefreshLoadingState(false);
    });

    webview.addEventListener('did-fail-load', (event: Event) => {
        const failEvent = event as Electron.DidFailLoadEvent;
        if (failEvent.errorCode === -3) {
            return;
        }

        setRefreshLoadingState(false);
        const label = currentData?.query ?? pendingExternalUrl ?? webview.src;
        void Visualizer({
            title: 'This URL could not be opened.',
            message: getUrlErrorMessage(label, failEvent.errorDescription, failEvent.errorCode),
        }).then(() => {
            window.location.href = 'index.html';
        });
    });

    webview.addEventListener('new-window', (event: any) => {
        event.preventDefault();
        const newUrl = event.url;
        if (newUrl && newUrl !== 'about:blank') {
            const params = new URLSearchParams();
            params.set('target', newUrl);
            params.set('query', newUrl);
            window.location.href = `url.html?${params.toString()}`;
        }
    });

    webview.addEventListener('context-menu', (event: any) => {
        if (!window.electronAPI?.showWebviewContextMenu) return;

        const params = event.params ?? {};
        window.electronAPI.showWebviewContextMenu({
            webContentsId: webview.getWebContentsId(),
            currentUrl: getCurrentUrl(),
            canCopy: Boolean(params.selectionText) || Boolean(params.editFlags?.canCopy),
            canPaste: Boolean(params.isEditable) || Boolean(params.editFlags?.canPaste),
        });
    });
};

const loadResult = (url: string): void => {
    try {
        new URL(url);
    } catch {
        void showUrlError(url, 'The address is invalid.');
        return;
    }

    if (env.isWeb) {
        window.location.href = url;
        return;
    }

    const webview = document.getElementById('result-frame') as Electron.WebviewTag | null;
    if (!webview) {
        openUrl(url);
        return;
    }
    initWebview(webview);
    pendingExternalUrl = url;
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

    const webview = document.getElementById('result-frame') as Electron.WebviewTag | null;
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
        recordSearchHistory('direct', currentData.query);
        loadResult(url);
        currentData = { ...currentData, platform: null, url };
        return;
    }

    const url = mkReqUrl(platform, currentData.query);
    if (url) {
        recordSearchHistory(platform, currentData.query);
        loadResult(url);
        currentData = { ...currentData, platform, url };
    }
};

const refreshCurrentResult = (): void => {
    const currentUrl = getCurrentUrl();
    if (!currentUrl) return;

    if (env.isWeb) {
        window.location.href = currentUrl;
        return;
    }

    const webview = document.getElementById('result-frame') as Electron.WebviewTag | null;
    if (webview) {
        setRefreshLoadingState(true);
        webview.reload();
        return;
    }

    loadResult(currentUrl);
};

const updateActiveHistoryQueryPreview = (query: string): void => {
    const activeHistoryQuery = document.querySelector('.c-history-item.is-active .c-history-query') as HTMLSpanElement | null;
    if (!activeHistoryQuery) return;

    const nextLabel = query || 'Untitled';
    activeHistoryQuery.textContent = nextLabel;
    activeHistoryQuery.title = nextLabel;
};

const initHeader = (): void => {
    const searchTitle = document.getElementById('search-title-input') as HTMLInputElement | null;
    if (!searchTitle || !currentData) return;

    searchTitle.value = currentData.query;
    searchTitle.title = currentData.query;
    updateActiveHistoryQueryPreview(currentData.query);

    const updateUrlStyle = (): void => {
        if (isLikelyUrl(searchTitle.value)) {
            searchTitle.classList.add('is-url-detected');
        } else {
            searchTitle.classList.remove('is-url-detected');
        }
    };

    const syncQueryPreview = (query: string): void => {
        if (!currentData) return;
        currentData = { ...currentData, query };
        searchTitle.title = query;
        updateActiveHistoryQueryPreview(query);
    };

    const performSearch = (): void => {
        const query = searchTitle.value.trim();
        if (!query || !currentData) return;

        syncQueryPreview(query);
        const directUrl = isLikelyUrl(query);
        const nextPlatform = directUrl ? null : (currentData.platform ?? getDefaultPlatform());
        const url = directUrl
            ? makeHref(query)
            : mkReqUrl(nextPlatform as Platform, query);
        if (url) {
            recordSearchHistory(directUrl ? 'direct' : (nextPlatform as Platform), query);
            currentData = { ...currentData, platform: nextPlatform, url };
            loadResult(url);
            searchTitle.title = query;
        }
    };

    searchTitle.addEventListener('input', () => {
        const query = searchTitle.value.trim();
        updateUrlStyle();
        syncQueryPreview(query);
    });
    searchTitle.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            performSearch();
        }
    });

    // Show full URL when focused
    searchTitle.addEventListener('focus', () => {
        searchTitle.value = currentData?.query ?? '';
    });

    // Truncate back when blurred if it's a URL
    searchTitle.addEventListener('blur', () => {
        if (!currentData) return;
        if (isLikelyUrl(currentData.query)) {
            const truncated = currentData.query.length > 40
                ? currentData.query.slice(0, 20) + '...' + currentData.query.slice(-17)
                : currentData.query;
            searchTitle.value = truncated;
        }
    });

    // Initial truncate if URL
    if (isLikelyUrl(currentData.query)) {
        const truncated = currentData.query.length > 40
            ? currentData.query.slice(0, 20) + '...' + currentData.query.slice(-17)
            : currentData.query;
        searchTitle.value = truncated;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    mountSidebarParts();
    initSidebar();
    currentData = parseSearchData();

    if (!currentData) return;

    loadResult(currentData.url);

    initHeader();

    const backBtn = document.getElementById('back-btn');
    backBtn?.addEventListener('click', goBack);
});