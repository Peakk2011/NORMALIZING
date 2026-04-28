/// <reference types="electron" />

import { focusModalInput, searchInPage } from './dom.js';

export const openSearchModal = (modal: HTMLElement, modalQueryInput: HTMLTextAreaElement): void => {
    const pageInput = document.getElementById('queryInput') as HTMLTextAreaElement | null;
    if (pageInput) {
        modalQueryInput.value = pageInput.value;
    }
    modal.classList.remove('hidden');
    modal.classList.remove('is-visible');
    modal.setAttribute('aria-hidden', 'false');
    window.requestAnimationFrame(() => {
        modal.classList.add('is-visible');
    });
    focusModalInput(modalQueryInput);
};

export const closeSearchModal = (modal: HTMLElement): void => {
    const webview = document.getElementById('resultFrame') as Electron.WebviewTag | null;
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
            modal.classList.add('hidden');
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
    const modalFind = modal.querySelector<HTMLButtonElement>('#sidebarSearchFindBtn');
    const modalClear = modal.querySelector<HTMLButtonElement>('#sidebarSearchClearBtn');
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
        searchInPage(query);
    };

    modalFind?.addEventListener('click', () => {
        runSearch();
    });

    modalClear?.addEventListener('click', () => {
        modalQueryInput.value = '';
        modalQueryInput.focus();
        const webview = document.getElementById('resultFrame') as Electron.WebviewTag | null;
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
};
