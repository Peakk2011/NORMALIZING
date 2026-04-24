import doSearch from '../search/search.js';
import { closeMenu } from '../io/menu.js';

const initSubstrate = (): void => {
    const queryInput = document.getElementById('queryInput') as HTMLTextAreaElement | null;
    if (!queryInput) return;

    queryInput.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            closeMenu();
            return;
        }
        if (e.key === 'Enter') {
            if (e.ctrlKey || e.metaKey) return;
            e.preventDefault();
            doSearch('google');
            closeMenu();
        }
    });
};

export default initSubstrate;