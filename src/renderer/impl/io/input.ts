import doSearch, { isLikelyUrl } from '../search/search.js';

const navigateToDirectUrl = (query: string): void => {
    doSearch('google', query);
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
