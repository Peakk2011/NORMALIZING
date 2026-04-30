import doSearch, { deleteSearchHistory, isActiveSearchHistory, makeHref, renameSearchHistory, setActiveSearchHistory } from '../../../search/search.js';
import mkReqUrl from '../../../search/mk_req_url.js';
import { Visualizer } from '../../../../../visualizer/visualizer.js';
import historyItemMenuHtml, { createHistoryItemMainContent, historyItemMenuToggleHtml } from '../../hist_ctx.js';
import type { HistoryRecord, RefreshFn, CloseSidebarFn } from './types.js';

const copyText = async (value: string): Promise<void> => {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
};

const getHistoryRecordUrl = (record: HistoryRecord): string | null => {
    if (record.platform === 'direct') {
        return makeHref(record.query);
    }

    return mkReqUrl(record.platform, record.query);
};

const isCurrentRecordOpen = (record: HistoryRecord): boolean => {
    if (!window.location.pathname.includes('url.html')) {
        return false;
    }

    const params = new URLSearchParams(window.location.search);
    const query = params.get('query');
    const target = params.get('target');
    const platform = params.get('platform');

    if (record.platform === 'direct') {
        return query === record.query && target === record.query;
    }

    return query === record.query && platform === record.platform;
};

export const createHistoryItem = (
    record: HistoryRecord,
    closeSidebarFn: CloseSidebarFn,
    refresh: RefreshFn,
    closeOpenMenu: () => void,
): HTMLElement => {
    let isRenaming = false;
    const shell = document.createElement('div');
    shell.className = 'c-history-item-shell';

    const item = document.createElement('div');
    item.className = 'c-history-item';
    if (isActiveSearchHistory(record)) {
        item.classList.add('is-active');
    }

    const mainButton = document.createElement('button');
    mainButton.type = 'button';
    mainButton.className = 'c-history-item-main';
    mainButton.appendChild(createHistoryItemMainContent(record.query, record.platform));
    const queryLabel = mainButton.querySelector('.c-history-query') as HTMLSpanElement | null;
    mainButton.addEventListener('click', () => {
        if (isRenaming) return;
        closeOpenMenu();
        setActiveSearchHistory(record);
        closeSidebarFn();
        doSearch(record.platform === 'direct' ? 'google' : record.platform, record.query);
    });

    const menuToggle = document.createElement('button');
    menuToggle.type = 'button';
    menuToggle.className = 'c-history-item-menu-toggle';
    menuToggle.title = 'History item actions';
    menuToggle.innerHTML = historyItemMenuToggleHtml;

    const menu = document.createElement('div');
    menu.className = 'c-history-item-menu u-hidden';
    menu.innerHTML = historyItemMenuHtml();

    const copyButton = menu.querySelector<HTMLButtonElement>('[data-action="copy"]');
    const renameButton = menu.querySelector<HTMLButtonElement>('[data-action="rename"]');
    const deleteButton = menu.querySelector<HTMLButtonElement>('[data-action="delete"]');

    if (!copyButton || !renameButton || !deleteButton) {
        item.append(mainButton, menuToggle);
        shell.append(item, menu);
        return shell;
    }

    copyButton.addEventListener('click', async (event: MouseEvent) => {
        event.stopPropagation();
        const url = getHistoryRecordUrl(record);
        if (!url) return;

        try {
            await copyText(url);
            closeOpenMenu();
            await Visualizer({ title: 'Copied URL.' });
        } catch {
            closeOpenMenu();
            await Visualizer({
                title: 'Copy failed.',
                message: 'Unable to copy this URL right now.',
            });
        }
    });

    const finishRename = async (
        renameInput: HTMLInputElement,
        nextQuery: string,
        save: boolean,
    ): Promise<void> => {
        if (!queryLabel) return;

        isRenaming = false;
        item.classList.remove('is-renaming');
        renameInput.remove();

        queryLabel.style.display = '';

        if (!save) return;

        const renamedRecord = renameSearchHistory(record, nextQuery);
        if (!renamedRecord) {
            await Visualizer({
                title: 'Rename failed.',
                message: 'Please enter a valid name for this history item.',
            });
            return;
        }

        refresh();
    };

    renameButton.addEventListener('click', (event: MouseEvent) => {
        event.stopPropagation();
        closeOpenMenu();
        if (!queryLabel || isRenaming) {
            return;
        }

        isRenaming = true;
        item.classList.add('is-renaming');

        const renameInput = document.createElement('input');
        renameInput.type = 'text';
        renameInput.className = 'c-history-query-input';
        renameInput.value = record.query;
        renameInput.setAttribute('aria-label', 'Rename history item');

        // Hide label, show input
        queryLabel.style.display = 'none';
        mainButton.insertBefore(renameInput, queryLabel);
        renameInput.focus();
        renameInput.select();

        let handled = false;
        const commit = async (): Promise<void> => {
            if (handled) return;
            handled = true;
            await finishRename(renameInput, renameInput.value, true);
        };
        const cancel = async (): Promise<void> => {
            if (handled) return;
            handled = true;
            await finishRename(renameInput, record.query, false);
        };

        renameInput.addEventListener('click', (inputEvent: MouseEvent) => {
            inputEvent.stopPropagation();
        });

        renameInput.addEventListener('keydown', (inputEvent: KeyboardEvent) => {
            if (inputEvent.key === 'Enter') {
                inputEvent.preventDefault();
                void commit();
            }
            if (inputEvent.key === 'Escape') {
                inputEvent.preventDefault();
                void cancel();
            }
        });

        renameInput.addEventListener('blur', () => {
            void commit();
        });
    });

    deleteButton.addEventListener('click', (event: MouseEvent) => {
        event.stopPropagation();
        closeOpenMenu();
        const deletingCurrentRecord = isCurrentRecordOpen(record);
        shell.classList.add('is-removing');
        window.setTimeout(() => {
            deleteSearchHistory(record);
            if (deletingCurrentRecord) {
                closeSidebarFn();
                window.setTimeout(() => {
                    window.location.href = 'index.html';
                }, 220);
                return;
            }
            refresh();
        }, 180);
    });

    item.append(mainButton, menuToggle);
    shell.append(item, menu);
    return shell;
};