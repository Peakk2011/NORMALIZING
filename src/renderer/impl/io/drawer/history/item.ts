import doSearch, { deleteSearchHistory, toggleSearchHistoryPinned } from '../../../search/search.js';
import historyItemMenuHtml, { createHistoryItemMainContent, historyItemMenuToggleHtml } from '../../hist_ctx.js';
import type { HistoryRecord, RefreshFn, CloseSidebarFn } from './types.js';

export const createHistoryItem = (
    record: HistoryRecord,
    closeSidebarFn: CloseSidebarFn,
    refresh: RefreshFn,
): HTMLElement => {
    const item = document.createElement('div');
    item.className = 'history-item';

    const mainButton = document.createElement('button');
    mainButton.type = 'button';
    mainButton.className = 'history-item-main';
    mainButton.appendChild(createHistoryItemMainContent(record.query, record.platform));
    mainButton.addEventListener('click', () => {
        closeSidebarFn();
        doSearch(record.platform, record.query);
    });

    const menuToggle = document.createElement('button');
    menuToggle.type = 'button';
    menuToggle.className = 'history-item-menu-toggle';
    menuToggle.title = 'History item actions';
    menuToggle.innerHTML = historyItemMenuToggleHtml;

    const menu = document.createElement('div');
    menu.className = 'history-item-menu hidden';
    menu.innerHTML = historyItemMenuHtml(Boolean(record.pinned));

    const pinButton = menu.querySelector<HTMLButtonElement>('[data-action="pin"]');
    const deleteButton = menu.querySelector<HTMLButtonElement>('[data-action="delete"]');

    const pinBadge = document.createElement('span');
    pinBadge.className = 'history-item-badge';
    pinBadge.textContent = record.pinned ? 'Pinned' : '';

    if (!pinButton || !deleteButton) {
        item.append(mainButton, pinBadge, menuToggle, menu);
        return item;
    }

    pinButton.addEventListener('click', (event: MouseEvent) => {
        event.stopPropagation();
        toggleSearchHistoryPinned(record);
        refresh();
        menu.classList.add('hidden');
    });

    deleteButton.addEventListener('click', (event: MouseEvent) => {
        event.stopPropagation();
        deleteSearchHistory(record);
        refresh();
        menu.classList.add('hidden');
    });

    item.append(mainButton, pinBadge, menuToggle, menu);
    return item;
};
