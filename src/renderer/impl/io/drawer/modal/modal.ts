/// <reference types="electron" />

import { focusModalInput, searchInPage } from './dom.js';
import { Visualizer } from '../../../../../visualizer/visualizer.js';

export const openSearchModal = (modal: HTMLElement, modalQueryInput: HTMLTextAreaElement): void => {
    const pageInput = document.getElementById('query-input') as HTMLTextAreaElement | null;
    if (pageInput) {
        modalQueryInput.value = pageInput.value;
    }
    modal.classList.remove('u-hidden');
    modal.classList.remove('is-visible');
    modal.setAttribute('aria-hidden', 'false');
    window.requestAnimationFrame(() => {
        modal.classList.add('is-visible');
    });
    focusModalInput(modalQueryInput);
};

export const closeSearchModal = (modal: HTMLElement): void => {
    const webview = document.getElementById('result-frame') as Electron.WebviewTag | null;
    if (webview?.stopFindInPage) {
        try {
            webview.stopFindInPage('clearSelection');
        } catch {
            // ignore
        }
    }
    modal.setAttribute('aria-hidden', 'true');
    modal.classList.remove('is-visible');
    window.setTimeout(() => {
        if (modal.getAttribute('aria-hidden') === 'true') {
            modal.classList.add('u-hidden');
        }
    }, 180);
};

export const initSearchModal = (
    modal: HTMLElement,
    modalOverlay: HTMLElement | null,
    modalClose: HTMLButtonElement,
    modalQueryInput: HTMLTextAreaElement,
    closeSidebarFn: () => void,
): void => {
    const modalFind = modal.querySelector<HTMLButtonElement>('#sidebar-search-find-btn');
    const modalClear = modal.querySelector<HTMLButtonElement>('#sidebar-search-clear-btn');
    const isSearchShortcut = (event: KeyboardEvent): boolean => {
        const hasModifier = event.ctrlKey || event.metaKey;
        return hasModifier && event.code === 'KeyF' && !event.altKey;
    };

    const runSearch = (): void => {
        const query = modalQueryInput.value.trim();
        if (!query) {
            modalQueryInput.focus();
            return;
        }
        void searchInPage(query);
    };

    modalFind?.addEventListener('click', () => {
        runSearch();
    });

    modalClear?.addEventListener('click', () => {
        modalQueryInput.value = '';
        modalQueryInput.focus();
        const webview = document.getElementById('result-frame') as Electron.WebviewTag | null;
        if (webview?.stopFindInPage) {
            try {
                webview.stopFindInPage('clearSelection');
            } catch {
                // ignore
            }
        }
    });

    modalClose.addEventListener('click', (event: MouseEvent) => {
        event.stopPropagation();
        closeSearchModal(modal);
    });

    modalOverlay?.addEventListener('click', () => {
        closeSearchModal(modal);
    });

    modalQueryInput.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            runSearch();
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            closeSearchModal(modal);
        }
    });

    document.addEventListener('keydown', (event: KeyboardEvent) => {
        if (isSearchShortcut(event)) {
            event.preventDefault();
            if (modal.getAttribute('aria-hidden') === 'false') {
                closeSearchModal(modal);
                return;
            }
            openSearchModal(modal, modalQueryInput);
        }
    });

    const loveQueries = new Set(['รัก', 'คิดถึง', 'หึง', 'เป็นห่วง', 'ไว้ใจ']);

    window.addEventListener('normalizing:find-result', ((event: Event) => {
        if (modal.getAttribute('aria-hidden') !== 'false') return;

        const customEvent = event as CustomEvent<{ query?: string; matches?: number }>;
        const query = customEvent.detail?.query?.trim();
        const matches = Number(customEvent.detail?.matches ?? 0);

        if (!query || matches > 0) return;

        let title: string;
        if (query === 'มนุษย์') {
            title = 'ไม่เจอ มนุษย์ ผู้ที่เป็นคนแสนวิเศษ ผู้ที่ไม่เพลิดเพลินใจกับตน';
        } else if (loveQueries.has(query)) {
            title = `ไม่เจอความ "${query}" โปรดหาคนรัก`;
        } else {
            title = `Not found "${query}" try again.`;
        }

        void Visualizer({
            title,
        });
    }) as EventListener);
};