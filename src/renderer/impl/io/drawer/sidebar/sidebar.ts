import { openSidebar, closeSidebar, toggleSidebar } from './dom.js';
import { openSearchModal, closeSearchModal, initSearchModal } from '../modal/modal.js';
import { clearSearchInput } from '../modal/dom.js';
import { renderHistory } from '../history/history.js';
import { setActiveSearchHistory } from '../../../search/search.js';
import { getThemePreference, setThemePreference, type ThemePreference } from '../../theme.js';

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
        return stored === 'true' && window.innerWidth > 768;
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

    if (
        !sidebarToggle || !sidebar || !sidebarClose || !searchBtn ||
        !newBtn || !historyList || !modal || !modalClose || !modalQueryInput ||
        !settingsBtn || !settingsModal || !settingsClose
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
    } = els;
    const modalOverlay = modal.querySelector('[data-close="true"]') as HTMLElement | null;
    const settingsOverlay = settingsModal.querySelector('[data-settings-close="true"]') as HTMLElement | null;
    const settingsTabs = Array.from(settingsModal.querySelectorAll<HTMLButtonElement>('[data-settings-tab]'));
    const settingsPanels = Array.from(settingsModal.querySelectorAll<HTMLElement>('[data-settings-panel]'));
    const themeButtons = Array.from(settingsModal.querySelectorAll<HTMLButtonElement>('[data-theme-choice]'));

    const menuState = { current: null as HTMLElement | null };

    const closeOpenMenu = (): void => {
        if (menuState.current) {
            menuState.current.classList.add('u-hidden');
            menuState.current = null;
        }
    };

    const refresh = (): void => renderHistory(historyList, sidebar, menuState, closeOpenMenu, refresh);
    const setActiveSettingsTab = (tab: string): void => {
        settingsTabs.forEach((btn) => {
            const active = btn.dataset.settingsTab === tab;
            btn.classList.toggle('is-active', active);
            btn.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        settingsPanels.forEach((panel) => {
            const active = panel.dataset.settingsPanel === tab;
            panel.classList.toggle('is-active', active);
        });
    };
    const syncThemeSelection = (): void => {
        const pref = getThemePreference();
        themeButtons.forEach((btn) => {
            const isActive = btn.dataset.themeChoice === pref;
            btn.classList.toggle('is-active', isActive);
        });
    };
    const openSettingsModal = (): void => {
        settingsModal.classList.remove('u-hidden');
        settingsModal.classList.add('is-visible');
        settingsModal.setAttribute('aria-hidden', 'false');
        setActiveSettingsTab('interface');
        syncThemeSelection();
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
            setActiveSettingsTab(tab.dataset.settingsTab ?? 'interface');
        });
    });
    themeButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const next = (btn.dataset.themeChoice ?? 'system') as ThemePreference;
            setThemePreference(next);
            syncThemeSelection();
        });
    });

    const isCompactScreen = (): boolean => window.innerWidth <= 768;

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

    // Restore sidebar state on page load
    if (getSidebarState()) {
        openSidebar(sidebar, refresh);
    }

    refresh();
};

export default initSidebar;
