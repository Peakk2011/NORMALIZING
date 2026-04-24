import type { Platform } from '../data/usrspace.js';
import doSearch from '../search/search.js';   
import { closeMenu } from './menu.js';

const initBtn = (): void => {
    const buttons = document.querySelectorAll<HTMLButtonElement>('.platforms button');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const platform = button.dataset.platform as Platform;
            if (platform) {
                doSearch(platform);
                closeMenu();
            }
        });
    });
};

export default initBtn;