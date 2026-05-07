import { openSidebar, closeSidebar, toggleSidebar } from './dom.js';
import { openSearchModal, closeSearchModal, initSearchModal } from '../modal/modal.js';
import { clearSearchInput } from '../modal/dom.js';
import { renderHistory } from '../history/history.js';
import { clearSearchHistory, getSearchHistory, setActiveSearchHistory } from '../../../search/search.js';
import type { Platform } from '../../../data/usrspace.js';
import { getThemePreference, setThemePreference, type ThemePreference } from '../../theme.js';
import {
    applyCompactSidebarPreference,
    getCompactSidebarPreference,
    getDefaultPlatform,
    getRestoreSidebarPreference,
    setCompactSidebarPreference,
    setDefaultPlatform,
    setRestoreSidebarPreference,
} from '../../settings.js';

const isUrlPage = window.location.pathname.includes('url.html');
const SIDEBAR_STATE_KEY = 'sidebarOpenState';

const saveSidebarState = (isOpen: boolean): void => {
    try {
        localStorage.setItem(SIDEBAR_STATE_KEY, isOpen.toString());
    } catch {
        // ignore storage errors
    }
};

const getSidebarState = (): boolean => {
    try {
        const stored = localStorage.getItem(SIDEBAR_STATE_KEY);
        return getRestoreSidebarPreference() && stored === 'true' && window.innerWidth > 768;
    } catch {
        return false;
    }
};
const resolveElements = () => {
    const sidebarToggle = document.getElementById('sidebar-toggle-btn') as HTMLButtonElement | null;
    const sidebar = document.getElementById('history-sidebar') as HTMLElement | null;
    const sidebarClose = document.getElementById('sidebar-close') as HTMLButtonElement | null;
    const searchBtn = document.getElementById('sidebar-search-btn') as HTMLButtonElement | null;
    const newBtn = document.getElementById('sidebar-new-btn') as HTMLButtonElement | null;
    const historyList = document.getElementById('sidebar-history-list') as HTMLElement | null;
    const modal = document.getElementById('search-modal') as HTMLElement | null;
    const modalClose = document.getElementById('search-modal-close') as HTMLButtonElement | null;
    const modalQueryInput = document.getElementById('sidebar-modal-query-input') as HTMLTextAreaElement | null;
    const settingsBtn = document.getElementById('sidebar-settings-btn') as HTMLButtonElement | null;
    const settingsModal = document.getElementById('settings-modal') as HTMLElement | null;
    const settingsClose = document.getElementById('settings-modal-close') as HTMLButtonElement | null;
    const restoreSidebarToggle = document.getElementById('settings-restore-sidebar-toggle') as HTMLInputElement | null;
    const compactSidebarToggle = document.getElementById('settings-compact-sidebar-toggle') as HTMLInputElement | null;
    const historySummary = document.getElementById('settings-history-summary') as HTMLElement | null;
    const clearRecentBtn = document.getElementById('settings-clear-recent-btn') as HTMLButtonElement | null;
    const clearAllHistoryBtn = document.getElementById('settings-clear-all-history-btn') as HTMLButtonElement | null;

    if (
        !sidebarToggle || !sidebar || !sidebarClose || !searchBtn ||
        !newBtn || !historyList || !modal || !modalClose || !modalQueryInput ||
        !settingsBtn || !settingsModal || !settingsClose || !restoreSidebarToggle ||
        !compactSidebarToggle || !historySummary || !clearRecentBtn || !clearAllHistoryBtn
    ) return null;

    return {
        sidebarToggle,
        sidebar,
        sidebarClose,
        searchBtn,
        newBtn,
        historyList,
        modal,
        modalClose,
        modalQueryInput,
        settingsBtn,
        settingsModal,
        settingsClose,
        restoreSidebarToggle,
        compactSidebarToggle,
        historySummary,
        clearRecentBtn,
        clearAllHistoryBtn,
    };
};

const initSidebar = (): void => {
    const els = resolveElements();
    if (!els) return;

    const {
        sidebarToggle,
        sidebar,
        sidebarClose,
        searchBtn,
        newBtn,
        historyList,
        modal,
        modalClose,
        modalQueryInput,
        settingsBtn,
        settingsModal,
        settingsClose,
        restoreSidebarToggle,
        compactSidebarToggle,
        historySummary,
        clearRecentBtn,
        clearAllHistoryBtn,
    } = els;
    const modalOverlay = modal.querySelector('[data-close="true"]') as HTMLElement | null;
    const settingsOverlay = settingsModal.querySelector('[data-settings-close="true"]') as HTMLElement | null;
    const settingsTabs = Array.from(settingsModal.querySelectorAll<HTMLButtonElement>('[data-settings-tab]'));
    const settingsPanels = Array.from(settingsModal.querySelectorAll<HTMLElement>('[data-settings-panel]'));
    const themeButtons = Array.from(settingsModal.querySelectorAll<HTMLButtonElement>('[data-theme-choice]'));
    const defaultPlatformButtons = Array.from(settingsModal.querySelectorAll<HTMLButtonElement>('[data-default-platform]'));

    const menuState = { current: null as HTMLElement | null };
    let activeSettingsTab = 'general';

    const closeOpenMenu = (): void => {
        if (menuState.current) {
            menuState.current.classList.add('u-hidden');
            menuState.current = null;
        }
    };

    const refresh = (): void => renderHistory(historyList, sidebar, menuState, closeOpenMenu, refresh);
    const syncHistorySummary = (): void => {
        const history = getSearchHistory();
        const pinnedCount = history.filter(item => item.pinned).length;
        const recentCount = history.length - pinnedCount;
        historySummary.textContent = `${recentCount} recent item${recentCount === 1 ? '' : 's'} and ${pinnedCount} pinned item${pinnedCount === 1 ? '' : 's'}.`;
    };
    const setActiveSettingsTab = (tab: string): void => {
        const currentIndex = settingsTabs.findIndex(btn => btn.dataset.settingsTab === activeSettingsTab);
        const nextIndex = settingsTabs.findIndex(btn => btn.dataset.settingsTab === tab);
        const motion = nextIndex >= currentIndex ? 'up' : 'down';

        settingsTabs.forEach((btn) => {
            const active = btn.dataset.settingsTab === tab;
            btn.classList.toggle('is-active', active);
            btn.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        settingsPanels.forEach((panel) => {
            const active = panel.dataset.settingsPanel === tab;
            panel.dataset.motion = motion;
            panel.classList.toggle('is-active', active);
        });
        activeSettingsTab = tab;
    };
    const syncThemeSelection = (): void => {
        const pref = getThemePreference();
        themeButtons.forEach((btn) => {
            const isActive = btn.dataset.themeChoice === pref;
            btn.classList.toggle('is-active', isActive);
        });
    };
    const syncDefaultPlatformSelection = (): void => {
        const nextDefault = getDefaultPlatform();
        defaultPlatformButtons.forEach((btn) => {
            btn.classList.toggle('is-active', btn.dataset.defaultPlatform === nextDefault);
        });
    };
    const syncSettingsState = (): void => {
        restoreSidebarToggle.checked = getRestoreSidebarPreference();
        compactSidebarToggle.checked = getCompactSidebarPreference();
        syncThemeSelection();
        syncDefaultPlatformSelection();
        syncHistorySummary();
    };
    const openSettingsModal = (): void => {
        settingsModal.classList.remove('u-hidden');
        settingsModal.classList.add('is-visible');
        settingsModal.setAttribute('aria-hidden', 'false');
        setActiveSettingsTab(activeSettingsTab);
        syncSettingsState();
    };
    const closeSettingsModal = (): void => {
        settingsModal.classList.remove('is-visible');
        settingsModal.setAttribute('aria-hidden', 'true');
        window.setTimeout(() => {
            if (settingsModal.getAttribute('aria-hidden') === 'true') {
                settingsModal.classList.add('u-hidden');
            }
        }, 160);
    };

    sidebarToggle.addEventListener('click', (event: MouseEvent) => {
        event.stopPropagation();
        const wasOpen = sidebar.classList.contains('is-open');
        toggleSidebar(sidebar, refresh);
        saveSidebarState(!wasOpen);
    });

    sidebarClose.addEventListener('click', (event: MouseEvent) => {
        event.stopPropagation();
        closeSidebar(sidebar);
        saveSidebarState(false);
    });

    searchBtn.addEventListener('click', () => {
        openSearchModal(modal, modalQueryInput);
    });

    newBtn.addEventListener('click', () => {
        setActiveSearchHistory(null);
        closeSidebar(sidebar);
        if (isUrlPage) {
            window.setTimeout(() => {
                window.location.href = 'index.html';
            }, 220);
            return;
        }
        clearSearchInput(modalQueryInput);
        closeSearchModal(modal);
    });
    settingsBtn.addEventListener('click', () => {
        openSettingsModal();
    });
    settingsClose.addEventListener('click', (event: MouseEvent) => {
        event.stopPropagation();
        closeSettingsModal();
    });
    settingsOverlay?.addEventListener('click', () => {
        closeSettingsModal();
    });
    settingsTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            setActiveSettingsTab(tab.dataset.settingsTab ?? 'general');
        });
    });
    themeButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const next = (btn.dataset.themeChoice ?? 'system') as ThemePreference;
            setThemePreference(next);
            syncThemeSelection();
        });
    });
    defaultPlatformButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const next = (btn.dataset.defaultPlatform ?? 'google') as Platform;
            setDefaultPlatform(next);
            syncDefaultPlatformSelection();
        });
    });
    restoreSidebarToggle.addEventListener('change', () => {
        setRestoreSidebarPreference(restoreSidebarToggle.checked);
        if (!restoreSidebarToggle.checked) {
            saveSidebarState(false);
        }
    });
    compactSidebarToggle.addEventListener('change', () => {
        setCompactSidebarPreference(compactSidebarToggle.checked);
        applyCompactSidebarPreference();
    });
    clearRecentBtn.addEventListener('click', () => {
        clearSearchHistory(true);
        syncHistorySummary();
        refresh();
    });
    clearAllHistoryBtn.addEventListener('click', () => {
        clearSearchHistory(false);
        syncHistorySummary();
        refresh();
    });

    const isCompactScreen = (): boolean => window.innerWidth <= 768;
    applyCompactSidebarPreference();

    document.addEventListener('click', (event: MouseEvent) => {
        const target = event.target as Node | null;
        if (!target) return;
        if (target instanceof Element && target.closest('.vz-overlay')) {
            return;
        }

        if (isCompactScreen() && !sidebar.contains(target) && !sidebarToggle.contains(target)) {
            closeSidebar(sidebar);
        }

        if (menuState.current && !menuState.current.contains(target)) {
            closeOpenMenu();
        }
    });
    document.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Escape' && settingsModal.getAttribute('aria-hidden') === 'false') {
            event.preventDefault();
            closeSettingsModal();
        }
    });

    initSearchModal(modal, modalOverlay, modalClose, modalQueryInput, () => closeSidebar(sidebar));

    const handleWebviewShortcut = (action: string): void => {
        if (action !== 'open-search') return;
        if (modal.getAttribute('aria-hidden') === 'false') {
            modalQueryInput.focus();
            return;
        }
        openSearchModal(modal, modalQueryInput);
    };

    window.addEventListener('normalizing:webview-shortcut', ((event: Event) => {
        const customEvent = event as CustomEvent<{ action: string }>;
        const action = customEvent.detail?.action;
        if (!action) return;
        if (action === 'close-tab') return;
        handleWebviewShortcut(action);
    }) as EventListener);

    if (window.electronAPI?.onWebviewShortcut) {
        window.electronAPI.onWebviewShortcut((payload) => {
            handleWebviewShortcut(payload.action);
        });
    }

    // Handle about links
    document.addEventListener('click', (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (target.classList.contains('c-settings-about-link') && target.dataset.aboutLink) {
            event.preventDefault();
            const url = target.dataset.aboutLink;
            window.electronAPI?.openExternal(url);
            window.electronAPI?.openUrlHtml('direct', url);
        }
    });

    // Restore sidebar state on page load
    if (getSidebarState()) {
        openSidebar(sidebar, refresh);
    }

    syncSettingsState();
    refresh();
};

export default initSidebar;