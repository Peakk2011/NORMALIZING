import doSearch from '../search/search.js';
import type { NormalizingEnv } from '../../types/window.js';

const isLikelyUrl = (value: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) return false;

    const schemePattern = /^[a-z][a-z\d+\-.]*:\/\//i;
    const hostPattern = /^(?:[\w-]+\.)+[a-z]{2,}(?:[:/].*)?$/i;
    return schemePattern.test(trimmed) || hostPattern.test(trimmed);
};

const makeHref = (value: string): string => {
    const trimmed = value.trim();
    if (/^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed)) {
        return trimmed;
    }
    if (/^\/\//.test(trimmed)) {
        return `https:${trimmed}`;
    }
    return `https://${trimmed}`;
};

const navigateToDirectUrl = (query: string): void => {
    const href = makeHref(query);
    const env: NormalizingEnv | undefined = window.env ?? window.__normalizingEnv;

    if (env?.isWeb) {
        window.location.href = href;
        return;
    }

    const urlHtmlUrl = `${window.location.origin}/url.html?target=${encodeURIComponent(query)}&query=${encodeURIComponent(query)}`;
    window.location.href = urlHtmlUrl;
};

const initInput = (): void => {
    const queryInput = document.getElementById('queryInput') as HTMLTextAreaElement | null;
    if (!queryInput) return;

    const resize = (): void => {
        queryInput.style.height = 'auto';
        queryInput.style.height = `${Math.min(queryInput.scrollHeight, 160)}px`;
    };

    const updateUrlStyle = (): void => {
        if (isLikelyUrl(queryInput.value)) {
            queryInput.classList.add('url-detected');
        } else {
            queryInput.classList.remove('url-detected');
        }
    };

    const navigate = (): void => {
        const query = queryInput.value.trim();
        if (!query) return;

        if (isLikelyUrl(query)) {
            navigateToDirectUrl(query);
            return;
        }

        doSearch('google', query);
    };

    queryInput.addEventListener('input', () => {
        resize();
        updateUrlStyle();
    });

    queryInput.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            navigate();
        }
        if (event.key === 'Escape' && queryInput.classList.contains('url-detected')) {
            queryInput.classList.remove('url-detected');
        }
    });

    resize();
};

export default initInput;