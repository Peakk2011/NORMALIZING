import { openSidebar, closeSidebar, toggleSidebar } from './dom.js';
import { openSearchModal, closeSearchModal, initSearchModal } from '../modal/modal.js';
import { clearSearchInput } from '../modal/dom.js';
import { renderHistory } from '../history/history.js';
import { setActiveSearchHistory } from '../../../search/search.js';

const isUrlPage = window.location.pathname.includes('url.html');

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

    if (
        !sidebarToggle || !sidebar || !sidebarClose || !searchBtn ||
        !newBtn || !historyList || !modal || !modalClose || !modalQueryInput
    ) return null;

    return { sidebarToggle, sidebar, sidebarClose, searchBtn, newBtn, historyList, modal, modalClose, modalQueryInput };
};

const initSidebar = (): void => {
    const els = resolveElements();
    if (!els) return;

    const { sidebarToggle, sidebar, sidebarClose, searchBtn, newBtn, historyList, modal, modalClose, modalQueryInput } = els;
    const modalOverlay = modal.querySelector('[data-close="true"]') as HTMLElement | null;

    const menuState = { current: null as HTMLElement | null };

    const closeOpenMenu = (): void => {
        if (menuState.current) {
            menuState.current.classList.add('u-hidden');
            menuState.current = null;
        }
    };

    const refresh = (): void => renderHistory(historyList, sidebar, menuState, closeOpenMenu, refresh);

    sidebarToggle.addEventListener('click', (event: MouseEvent) => {
        event.stopPropagation();
        toggleSidebar(sidebar, refresh);
    });

    sidebarClose.addEventListener('click', (event: MouseEvent) => {
        event.stopPropagation();
        closeSidebar(sidebar);
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

    document.addEventListener('click', (event: MouseEvent) => {
        const target = event.target as Node | null;
        if (!target) return;
        if (target instanceof Element && target.closest('.vz-overlay')) {
            return;
        }

        if (!sidebar.contains(target) && !sidebarToggle.contains(target)) {
            closeSidebar(sidebar);
        }

        if (menuState.current && !menuState.current.contains(target)) {
            closeOpenMenu();
        }
    });

    initSearchModal(modal, modalOverlay, modalClose, modalQueryInput, () => closeSidebar(sidebar));
    refresh();
};

export default initSidebar;
