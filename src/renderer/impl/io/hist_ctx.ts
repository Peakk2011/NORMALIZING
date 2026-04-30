export const createHistoryItemMainContent = (query: string, platform: string): DocumentFragment => {
    const fragment = document.createDocumentFragment();

    const querySpan = document.createElement('span');
    querySpan.className = 'c-history-query';
    querySpan.textContent = query;

    const platformSpan = document.createElement('span');
    platformSpan.className = 'c-history-platform';
    platformSpan.textContent = platform === 'direct' ? 'Direct URL' : platform;

    fragment.append(querySpan, platformSpan);
    return fragment;
};

export const historyItemMenuToggleHtml = `
    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentcolor"><path d="M240-400q-33 0-56.5-23.5T160-480q0-33 23.5-56.5T240-560q33 0 56.5 23.5T320-480q0 33-23.5 56.5T240-400Zm240 0q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm240 0q-33 0-56.5-23.5T640-480q0-33 23.5-56.5T720-560q33 0 56.5 23.5T800-480q0 33-23.5 56.5T720-400Z"/></svg>
`;

const historyItemMenuHtml = (): string => `
    <button type="button" class="c-history-item-menu-btn" data-action="copy" style='border-top-right-radius: 4px; border-top-left-radius: 4px;'>
        <span>Copy URL</span>
    </button>
    <!--
        We encountered a problem with renaming when we changed the URL,
        It opened a different website, leading to user confusion.
        We will change from "Rename" to "Edit Search."
    -->
    <button type="button" class="c-history-item-menu-btn" data-action="rename">
        <span>Edit Search</span>
    </button>
    <button type="button" class="c-history-item-menu-btn" data-action="delete" style='border-bottom-right-radius: 4px; border-bottom-left-radius: 4px;'>
        <span>Delete</span>
    </button>
`;

export default historyItemMenuHtml;