import doSearch, { isLikelyUrl } from '../search/search.js';
import { getDefaultPlatform } from './settings.js';

const navigateToDirectUrl = (query: string): void => {
    doSearch(getDefaultPlatform(), query);
};

const initInput = (): void => {
    const queryInput = document.getElementById('query-input') as HTMLTextAreaElement | null;
    if (!queryInput) return;

    const resize = (): void => {
        queryInput.style.height = 'auto';
        queryInput.style.height = `${Math.min(queryInput.scrollHeight, 160)}px`;
    };

    const updateUrlStyle = (): void => {
        if (isLikelyUrl(queryInput.value)) {
            queryInput.classList.add('is-url-detected');
        } else {
            queryInput.classList.remove('is-url-detected');
        }
    };

    const navigate = (): void => {
        const query = queryInput.value.trim();
        if (!query) return;

        if (isLikelyUrl(query)) {
            navigateToDirectUrl(query);
            return;
        }

        doSearch(getDefaultPlatform(), query);
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
        if (event.key === 'Escape' && queryInput.classList.contains('is-url-detected')) {
            queryInput.classList.remove('is-url-detected');
        }
    });

    resize();
};

export default initInput;