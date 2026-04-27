import { openSidebar, closeSidebar, toggleSidebar } from './dom.js';
import { openSearchModal, closeSearchModal, initSearchModal } from '../modal/modal.js';
import { clearSearchInput } from '../modal/dom.js';
import { renderHistory } from '../history/history.js';

const isUrlPage = window.location.pathname.includes('url.html');

const resolveElements = () => {
    const sidebarToggle = document.getElementById('sidebarToggle') as HTMLButtonElement | null;
    const sidebar = document.getElementById('historySidebar') as HTMLElement | null;
    const sidebarClose = document.getElementById('sidebarClose') as HTMLButtonElement | null;
    const searchBtn = document.getElementById('sidebarSearchBtn') as HTMLButtonElement | null;
    const newBtn = document.getElementById('sidebarNewBtn') as HTMLButtonElement | null;
    const historyList = document.getElementById('sidebarHistoryList') as HTMLElement | null;
    const modal = document.getElementById('searchModal') as HTMLElement | null;
    const modalClose = document.getElementById('searchModalClose') as HTMLButtonElement | null;
    const modalQueryInput = document.getElementById('sidebarModalQueryInput') as HTMLTextAreaElement | null;

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

    let openMenu: HTMLElement | null = null;

    const closeOpenMenu = (): void => {
        if (openMenu) {
            openMenu.classList.add('hidden');
            openMenu = null;
        }
    };

    const refresh = (): void => renderHistory(historyList, sidebar, openMenu, closeOpenMenu, refresh);

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
        if (isUrlPage) {
            window.location.href = 'index.html';
            return;
        }
        clearSearchInput(modalQueryInput);
        closeSearchModal(modal);
        closeSidebar(sidebar);
    });

    document.addEventListener('click', (event: MouseEvent) => {
        const target = event.target as Node | null;
        if (!target) return;

        if (!sidebar.contains(target) && !sidebarToggle.contains(target)) {
            closeSidebar(sidebar);
        }

        if (openMenu && !openMenu.contains(target)) {
            closeOpenMenu();
        }
    });

    initSearchModal(modal, modalOverlay, modalClose, modalQueryInput, () => closeSidebar(sidebar));
    refresh();
};

export default initSidebar;