import { closeMenu } from '../io/menu.js';

const initSubstrate = (): void => {
    const queryInput = document.getElementById('query-input') as HTMLTextAreaElement | null;
    if (!queryInput) return;

    queryInput.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            closeMenu();
            return;
        }
    });
};

export default initSubstrate;