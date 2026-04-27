import { getSearchHistory } from '../../../search/search.js';
import { createHistoryItem } from './item.js';
import type { RefreshFn } from './types.js';

export const renderHistory = (
    historyList: HTMLElement,
    sidebar: HTMLElement,
    openMenu: HTMLElement | null,
    closeOpenMenu: () => void,
    refresh: RefreshFn,
): void => {
    historyList.innerHTML = '';
    closeOpenMenu();

    const history = getSearchHistory();

    if (history.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'history-empty';
        empty.textContent = 'No recent searches yet.';
        historyList.appendChild(empty);
        return;
    }

    history.slice(0, 12).forEach(record => {
        const item = createHistoryItem(
            record,
            () => { sidebar.classList.remove('open'); setTimeout(() => sidebar.classList.add('hidden'), 220); },
            refresh,
        );

        const menu = item.querySelector('.history-item-menu') as HTMLElement | null;
        const toggle = item.querySelector('.history-item-menu-toggle') as HTMLElement | null;

        if (menu && toggle) {
            toggle.addEventListener('click', (event: MouseEvent) => {
                event.stopPropagation();
                closeOpenMenu();
                menu.classList.toggle('hidden');
                openMenu = menu.classList.contains('hidden') ? null : menu;
            });
        }

        historyList.appendChild(item);
    });
};