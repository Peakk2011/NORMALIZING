import { 
    closeSidebar,
    toggleSidebar
} from './dom.js';
import {
    openSearchModal,
    closeSearchModal,
    initSearchModal
} from '../modal/modal.js';
import { clearSearchInput } from '../modal/dom.js';
import { renderHistory } from '../history/history.js';
import {
    clearSearchHistory,
    getSearchHistory,
    setActiveSearchHistory
} from '../../../search/search.js';
import type { Platform } from '../../../data/usrspace.js';
import {
    getThemePreference,
    setThemePreference,
    type ThemePreference
} from '../../theme.js';
import {
    applyCompactSidebarPreference,
    getCompactSidebarPreference,
    getDefaultPlatform,
    getRestoreSidebarPreference,
    setCompactSidebarPreference,
    setDefaultPlatform,
    setRestoreSidebarPreference,
} from '../../settings.js';
import {
    getLanguagePreference,
    setLanguagePreference,
    translate,
    type Locale
} from '../../i18n.js';
import wait from "../../../../../api/wait.js";

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
    const languageButtons = Array.from(settingsModal.querySelectorAll<HTMLButtonElement>('[data-language]'));

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
        historySummary.textContent = translate('history.summary', {
            recentCount,
            recentPlural: recentCount === 1 ? '' : 's',
            pinnedCount,
            pinnedPlural: pinnedCount === 1 ? '' : 's',
        });
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
    const syncLanguageSelection = (): void => {
        const nextLanguage = getLanguagePreference();
        languageButtons.forEach((btn) => {
            btn.classList.toggle('is-active', btn.dataset.language === nextLanguage);
        });
    };
    const syncSettingsState = (): void => {
        restoreSidebarToggle.checked = getRestoreSidebarPreference();
        compactSidebarToggle.checked = getCompactSidebarPreference();
        syncThemeSelection();
        syncDefaultPlatformSelection();
        syncLanguageSelection();
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
        void wait(160).then(() => {
            if (settingsModal.getAttribute('aria-hidden') === 'true') {
                settingsModal.classList.add('u-hidden');
            }
        });
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
            void wait(220).then(() => {
                window.location.href = 'index.html';
            });
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
    languageButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const next = (btn.dataset.language ?? 'en') as Locale;
            setLanguagePreference(next);
            syncLanguageSelection();
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
        if (settingsModal.getAttribute('aria-hidden') === 'false') {
            // Settings modal is open
            const target = event.target as HTMLElement;
            const isInputLike = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

            // Handle Escape key to close settings
            if (event.key === 'Escape') {
                event.preventDefault();
                closeSettingsModal();
                return;
            }

            // Ignore Arrow keys if focus is in an input-like element
            if (isInputLike && (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
                return;
            }

            // Handle tab navigation with Arrow keys
            if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                event.preventDefault();
                // Check if focus is on a tab button
                if (target.classList.contains('c-settings-menu-btn') && settingsTabs.length > 0) {
                    const currentIndex = settingsTabs.indexOf(target as HTMLButtonElement);
                    const nextIndex = (currentIndex + 1) % settingsTabs.length;
                    const nextTab = settingsTabs[nextIndex];
                    if (nextTab) {
                        nextTab.focus();
                        setActiveSettingsTab(nextTab.dataset.settingsTab ?? 'general');
                    }
                }
                // Check if focus is on a theme button
                else if (target.classList.contains('c-theme-choice-btn') && themeButtons.length > 0) {
                    const currentIndex = themeButtons.indexOf(target as HTMLButtonElement);
                    const nextIndex = (currentIndex + 1) % themeButtons.length;
                    const nextBtn = themeButtons[nextIndex];
                    if (nextBtn) {
                        nextBtn.focus();
                        // Trigger click to activate the theme
                        nextBtn.click();
                    }
                }
                // Check if focus is on a platform button
                else if (target.classList.contains('c-settings-platform-btn') && defaultPlatformButtons.length > 0) {
                    const currentIndex = defaultPlatformButtons.indexOf(target as HTMLButtonElement);
                    const nextIndex = (currentIndex + 1) % defaultPlatformButtons.length;
                    const nextBtn = defaultPlatformButtons[nextIndex];
                    if (nextBtn) {
                        nextBtn.focus();
                        // Trigger click to activate the platform
                        nextBtn.click();
                    }
                }
            } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                event.preventDefault();
                // Check if focus is on a tab button
                if (target.classList.contains('c-settings-menu-btn') && settingsTabs.length > 0) {
                    const currentIndex = settingsTabs.indexOf(target as HTMLButtonElement);
                    const prevIndex = (currentIndex - 1 + settingsTabs.length) % settingsTabs.length;
                    const prevTab = settingsTabs[prevIndex];
                    if (prevTab) {
                        prevTab.focus();
                        setActiveSettingsTab(prevTab.dataset.settingsTab ?? 'general');
                    }
                }
                // Check if focus is on a theme button
                else if (target.classList.contains('c-theme-choice-btn') && themeButtons.length > 0) {
                    const currentIndex = themeButtons.indexOf(target as HTMLButtonElement);
                    const prevIndex = (currentIndex - 1 + themeButtons.length) % themeButtons.length;
                    const prevBtn = themeButtons[prevIndex];
                    if (prevBtn) {
                        prevBtn.focus();
                        // Trigger click to activate the theme
                        prevBtn.click();
                    }
                }
                // Check if focus is on a platform button
                else if (target.classList.contains('c-settings-platform-btn') && defaultPlatformButtons.length > 0) {
                    const currentIndex = defaultPlatformButtons.indexOf(target as HTMLButtonElement);
                    const prevIndex = (currentIndex - 1 + defaultPlatformButtons.length) % defaultPlatformButtons.length;
                    const prevBtn = defaultPlatformButtons[prevIndex];
                    if (prevBtn) {
                        prevBtn.focus();
                        // Trigger click to activate the platform
                        prevBtn.click();
                    }
                }
            }
        }
    });

    initSearchModal(modal, modalOverlay, modalClose, modalQueryInput, () => closeSidebar(sidebar));

    const handleWebviewShortcut = (action: string): void => {
        if (action === 'open-search') {
            if (modal.getAttribute('aria-hidden') === 'false') {
                modalQueryInput.focus();
                return;
            }
            openSearchModal(modal, modalQueryInput);
        } else if (action === 'close-tab') {
            window.dispatchEvent(new CustomEvent('normalizing:close-tab'));
        } else if (action === 'new-tab') {
            window.dispatchEvent(new CustomEvent('normalizing:new-tab'));
        } else if (action === 'toggle-settings') {
            if (settingsModal.getAttribute('aria-hidden') === 'false') {
                closeSettingsModal();
            } else {
                openSettingsModal();
            }
        }
    };

    window.addEventListener('normalizing:webview-shortcut', ((event: Event) => {
        const customEvent = event as CustomEvent<{ action: string }>;
        const action = customEvent.detail?.action;
        if (!action) return;
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

    // Sidebar state restoration removed to ensure it starts closed by default

    syncSettingsState();
    refresh();
};

export default initSidebar;