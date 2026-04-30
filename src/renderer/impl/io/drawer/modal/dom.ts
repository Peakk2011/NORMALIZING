/// <reference types="electron" />

export const focusModalInput = (modalQueryInput: HTMLTextAreaElement): void => {
    modalQueryInput.scrollTop = 0;
    modalQueryInput.focus();
};

export const searchInPage = (query: string): void => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const webview = document.getElementById('result-frame') as Electron.WebviewTag | null;
    if (webview && typeof webview.findInPage === 'function') {
        try {
            webview.findInPage(trimmed);
            return;
        } catch {
            // fallback below
        }
    }

    const browserFind = window.find;
    if (typeof browserFind === 'function') {
        browserFind(trimmed, false, false, true, false, false, false);
    }
};

export const clearSearchInput = (modalQueryInput: HTMLTextAreaElement): void => {
    const pageInput = document.getElementById('query-input') as HTMLTextAreaElement | null;
    if (pageInput) {
        pageInput.value = '';
        pageInput.focus();
    }
    modalQueryInput.value = '';
};
