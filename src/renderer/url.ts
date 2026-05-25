import type { Platform } from './impl/data/usrspace.js';
import mkReqUrl from './impl/search/mk_req_url.js';
import {
    isLikelyUrl,
    makeHref,
    recordSearchHistory,
    setActiveSearchHistory,
    deleteSearchHistory,
    getActiveSearchHistoryKey,
    getSearchHistory
} from './impl/search/search.js';
import initSidebar from './impl/io/sidebar.js';
import { mountSidebarParts } from './impl/io/sidebar_parts.js';
import { initTheme } from './impl/io/theme.js';
import { getDefaultPlatform } from './impl/io/settings.js';
import type { NormalizingEnv } from './types/window.js';
import { Visualizer } from '../visualizer/visualizer.js';
import { closeSidebar } from './impl/io/drawer/sidebar/dom.js';
import wait from '../api/wait.js';

interface SearchData {
    platform: Platform | null;
    query:    string;
    url:      string;
}

const VALID_PLATFORMS: Platform[] = [
    'google', 'youtube', 'threads', 'facebook',
    'pinterest', 'github', 'instagram',
];

const ua         = navigator.userAgent.toLowerCase();
const isMac      = ua.includes('mac');
const isWindows  = ua.includes('win');
const isLinux    = ua.includes('linux');
const isElectron = Boolean(window.electronAPI) || ua.includes('electron');

const env: NormalizingEnv = window.env ?? window.__normalizingEnv ?? {
    platform:   isMac ? 'mac' : isWindows ? 'windows' : isLinux ? 'linux' : 'unknown',
    runtime:    isElectron ? 'electron' : 'web',
    isElectron: isElectron,
    isWeb:      !isElectron,
    isDev:      location.hostname === 'localhost' || location.hostname === '127.0.0.1',
};

const setWindowEnv = (value: typeof env): void => {
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
            writable:     true,
            configurable: true,
            enumerable:   true,
        });
        return;
    }
    window.__normalizingEnv = value;
};

setWindowEnv(env);

document.documentElement.classList.add(`platform-${env.platform}`);
document.documentElement.classList.add(`runtime-${env.runtime}`);
document.documentElement.classList.add(env.isDev ? 'env-dev' : 'env-prod');
document.documentElement.classList.add('page-url');
initTheme();

let currentData:        SearchData | null          = null;
let activeWebview:      Electron.WebviewTag | null = null;
let pendingExternalUrl: string | null              = null;
let currentPageTitle:   string | null              = null;
let isUrlBarFocused     = false;

const isValidPlatform = (platform: string): platform is Platform =>
    VALID_PLATFORMS.includes(platform as Platform);

const getUrlErrorMessage = (query: string, detail?: string, errorCode?: number): string => {
    if (errorCode === -118) return `Connection timed out while opening:\n${query}`;
    if (errorCode === -106) return `No internet connection.\nUnable to open:\n${query}`;
    if (detail)             return `${query}\n${detail}`;
    return query;
};

const showUrlError = async (query: string, detail?: string): Promise<void> => {
    await Visualizer({
        title:   'This URL could not be opened.',
        message: getUrlErrorMessage(query, detail),
    });
    window.location.href = 'index.html';
};

const parseSearchData = (): SearchData | null => {
    const params        = new URLSearchParams(window.location.search);
    const platformParam = params.get('platform');
    const query         = params.get('query');
    const target        = params.get('target');

    if (target) {
        return { platform: null, query: query ?? target, url: makeHref(target) };
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
    return currentData?.url ?? null;
};

const setRefreshLoadingState = (isLoading: boolean): void => {
    const refreshBtn = document.getElementById('refresh-btn') as HTMLButtonElement | null;
    if (!refreshBtn) return;
    refreshBtn.classList.toggle('is-loading', isLoading);
    refreshBtn.disabled = isLoading;
    refreshBtn.setAttribute('aria-busy', String(isLoading));
};

const updateTitleFromWebview = async (): Promise<void> => {
    const searchTitle = document.getElementById('search-title-input') as HTMLInputElement | null;
    if (!searchTitle || !activeWebview) return;

    try {
        const webContentsId = activeWebview.getWebContentsId();
        const title         = await window.electronAPI?.getWebviewTitle(webContentsId);
        if (!title?.trim()) return;

        currentPageTitle = title.trim();

        if (!isUrlBarFocused) {
            searchTitle.value = currentPageTitle;
            searchTitle.title = currentPageTitle;
            searchTitle.classList.remove('is-url-detected');
        }
    } catch {
        // ignore
    }
};

const initWebview = (webview: Electron.WebviewTag): void => {
    if (activeWebview === webview) return;
    activeWebview = webview;

    const registerShortcut = (): void => {
        if (!window.electronAPI?.registerWebviewShortcut) return;
        try {
            const webContentsId = webview.getWebContentsId();
            if (typeof webContentsId === 'number' && webContentsId > 0) {
                window.electronAPI.registerWebviewShortcut(webContentsId);
            }
        } catch {
            // not ready yet, dom-ready will retry
        }
    };

    webview.addEventListener('did-start-loading', () => {
        setRefreshLoadingState(true);
        registerShortcut();
    });

    webview.addEventListener('did-stop-loading', () => {
        setRefreshLoadingState(false);
        void updateTitleFromWebview();
    });

    webview.addEventListener('did-fail-load', (event: Event) => {
        const failEvent = event as Electron.DidFailLoadEvent;
        if (failEvent.errorCode === -3) return;

        setRefreshLoadingState(false);
        const label = currentData?.query ?? pendingExternalUrl ?? webview.src;
        void Visualizer({
            title:   'This URL could not be opened.',
            message: getUrlErrorMessage(label, failEvent.errorDescription, failEvent.errorCode),
        }).then(() => {
            window.location.href = 'index.html';
        });
    });

    webview.addEventListener('new-window', (event: any) => {
        event.preventDefault();
        const newUrl: string | undefined = event.url;
        if (newUrl && newUrl !== 'about:blank') {
            window.electronAPI?.openUrlHtml('direct', newUrl);
        }
    });

    webview.addEventListener('context-menu', (event: any) => {
        if (!window.electronAPI?.showWebviewContextMenu) return;
        const params = event.params ?? {};
        window.electronAPI.showWebviewContextMenu({
            webContentsId: webview.getWebContentsId(),
            currentUrl:    getCurrentUrl(),
            canCopy:       Boolean(params.selectionText) || Boolean(params.editFlags?.canCopy),
            canPaste:      Boolean(params.isEditable)    || Boolean(params.editFlags?.canPaste),
        });
    });

    webview.addEventListener('page-title-updated', () => {
        void updateTitleFromWebview();
    });

    webview.addEventListener('dom-ready', () => {
        registerShortcut();
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
    webview.src        = url;
};

const goBack = (): void => {
    if (env.isWeb) {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = 'index.html';
        }
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
    const el = document.querySelector(
        '.c-history-item.is-active .c-history-query'
    ) as HTMLSpanElement | null;
    if (!el) return;
    const label    = query || 'Untitled';
    el.textContent = label;
    el.title       = label;
};

const truncateUrl = (url: string): string =>
    url.length > 40 ? `${url.slice(0, 20)}...${url.slice(-17)}` : url;

const initHeader = (): void => {
    const searchTitle = document.getElementById('search-title-input') as HTMLInputElement | null;
    if (!searchTitle || !currentData) return;

    searchTitle.value = currentData.query;
    searchTitle.title = currentData.query;
    updateActiveHistoryQueryPreview(currentData.query);

    const updateUrlStyle = (): void => {
        searchTitle.classList.toggle('is-url-detected', isLikelyUrl(searchTitle.value));
    };

    const syncQueryPreview = (query: string): void => {
        if (!currentData) return;
        currentData       = { ...currentData, query };
        searchTitle.title = query;
        updateActiveHistoryQueryPreview(query);
    };

    const performSearch = (): void => {
        const query = searchTitle.value.trim();
        if (!query || !currentData) return;

        syncQueryPreview(query);
        const directUrl    = isLikelyUrl(query);
        const nextPlatform = directUrl ? null : (currentData.platform ?? getDefaultPlatform());
        const url          = directUrl
            ? makeHref(query)
            : mkReqUrl(nextPlatform as Platform, query);

        if (url) {
            recordSearchHistory(directUrl ? 'direct' : (nextPlatform as Platform), query);
            currentData       = { ...currentData, platform: nextPlatform, url };
            searchTitle.title = query;
            loadResult(url);
        }
    };

    searchTitle.addEventListener('input', () => {
        syncQueryPreview(searchTitle.value.trim());
        updateUrlStyle();
    });

    searchTitle.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            performSearch();
        }
    });

    searchTitle.addEventListener('focus', () => {
        isUrlBarFocused  = true;
        const currentUrl = getCurrentUrl();
        if (currentUrl) searchTitle.value = currentUrl;
    });

    searchTitle.addEventListener('blur', () => {
        isUrlBarFocused = false;
        if (currentPageTitle) {
            searchTitle.value = currentPageTitle;
            searchTitle.title = currentPageTitle;
        } else if (currentData && isLikelyUrl(currentData.query)) {
            searchTitle.value = truncateUrl(currentData.query);
        }
    });

    if (isLikelyUrl(currentData.query)) {
        searchTitle.value = truncateUrl(currentData.query);
    }
};

const handleCloseTab = (): void => {
    const activeKey = getActiveSearchHistoryKey();
    if (activeKey) {
        const record = getSearchHistory().find(
            item => `${item.platform}::${item.query}` === activeKey
        );
        if (record) deleteSearchHistory(record);
    }

    setActiveSearchHistory(null);

    const sidebar = document.getElementById('history-sidebar') as HTMLElement | null;
    if (sidebar && !sidebar.classList.contains('u-hidden')) {
        closeSidebar(sidebar);
        void wait(220).then(() => { window.location.href = 'index.html'; });
    } else {
        window.location.href = 'index.html';
    }
};

const handleWebviewShortcut = (action: string): void => {
    switch (action) {
        case 'close-tab':      handleCloseTab(); break;
        case 'new-tab':        window.location.href = 'index.html'; break;
        case 'open-search':    break; // TODO: open in-page search UI
        case 'toggle-settings': break; // TODO: toggle settings panel
    }
};

document.addEventListener('DOMContentLoaded', () => {
    mountSidebarParts();
    initSidebar();

    currentData = parseSearchData();
    if (!currentData) return;

    loadResult(currentData.url);
    initHeader();

    window.addEventListener('normalizing:webview-shortcut', ((event: Event) => {
        const { detail } = event as CustomEvent<{ action: string }>;
        if (detail?.action) handleWebviewShortcut(detail.action);
    }) as EventListener);

    window.electronAPI?.onWebviewShortcut((payload) => {
        handleWebviewShortcut(payload.action);
    });

    document.getElementById('back-btn')?.addEventListener('click', goBack);
});