/// <reference types="electron" />

import { focusModalInput, searchInPage } from './dom.js';

export const openSearchModal = (modal: HTMLElement, modalQueryInput: HTMLTextAreaElement): void => {
    const pageInput = document.getElementById('queryInput') as HTMLTextAreaElement | null;
    if (pageInput) {
        modalQueryInput.value = pageInput.value;
    }
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
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
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
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

    modalQueryInput.addEventListener('input', () => {
        modalQueryInput.style.height = 'auto';
        modalQueryInput.style.height = `${Math.min(modalQueryInput.scrollHeight, 160)}px`;
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
};