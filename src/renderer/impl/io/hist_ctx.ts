export const createHistoryItemMainContent = (query: string, platform: string): DocumentFragment => {
    const fragment = document.createDocumentFragment();

    const querySpan = document.createElement('span');
    querySpan.className = 'history-query';
    querySpan.textContent = query;

    const platformSpan = document.createElement('span');
    platformSpan.className = 'history-platform';
    platformSpan.textContent = platform;

    fragment.append(querySpan, platformSpan);
    return fragment;
};

export const historyItemMenuToggleHtml = `
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 11h16v2H4v-2Zm0-6h16v2H4V5Zm0 12h16v2H4v-2Z"/></svg>
`;

const historyItemMenuHtml = (isPinned: boolean): string => `
    <button type="button" class="history-item-menu-btn" data-action="pin">
        <span>${isPinned ? 'Unpin' : 'Pin'}</span>
    </button>
    <button type="button" class="history-item-menu-btn" data-action="delete">
        <span>Delete</span>
    </button>
`;

export default historyItemMenuHtml;
