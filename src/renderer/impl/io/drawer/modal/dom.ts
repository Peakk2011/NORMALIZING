/// <reference types="electron" />

const dispatchFindResult = (query: string, matches: number): void => {
    window.dispatchEvent(new CustomEvent('normalizing:find-result', {
        detail: { query, matches },
    }));
};

export const focusModalInput = (modalQueryInput: HTMLTextAreaElement): void => {
    modalQueryInput.scrollTop = 0;
    modalQueryInput.focus();
};

export const searchInPage = async (query: string): Promise<void> => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const webview = document.getElementById('result-frame') as Electron.WebviewTag | null;
    if (webview) {
        try {
            const matches = await webview.executeJavaScript(`
                (() => {
                    const text = document.body?.innerText ?? document.documentElement?.innerText ?? "";
                    const haystack = text.toLocaleLowerCase();
                    const needle = ${JSON.stringify(trimmed.toLocaleLowerCase())};
                    if (!needle) return 0;

                    let count = 0;
                    let startIndex = 0;
                    while (true) {
                        const index = haystack.indexOf(needle, startIndex);
                        if (index === -1) break;
                        count += 1;
                        startIndex = index + needle.length;
                    }

                    return count;
                })()
            `, true);

            const safeMatches = Number(matches ?? 0);
            dispatchFindResult(trimmed, safeMatches);

            if (safeMatches > 0 && typeof webview.findInPage === 'function') {
                webview.findInPage(trimmed);
            }
            return;
        } catch {
            // fallback below
        }
    }

    const browserFind = window.find;
    if (typeof browserFind === 'function') {
        const found = browserFind(trimmed, false, false, true, false, false, false);
        dispatchFindResult(trimmed, found ? 1 : 0);
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