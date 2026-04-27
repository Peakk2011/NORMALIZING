const sidebarPartsHtml = `
    <aside id="historySidebar" class="history-sidebar hidden" aria-hidden="true">
        <div class="sidebar-header">
            <h1 class="sidebar-logo">NORMALIZING</h1>
            <button id="sidebarClose" class="sidebar-close" type="button" aria-label="Close sidebar">×</button>
        </div>
        <div class="sidebar-toolbar">
            <button id="sidebarNewBtn" class="sidebar-action-btn" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/></svg>
                <span>New</span>
            </button>
            <button id="sidebarSearchBtn" class="sidebar-action-btn sidebar-action-secondary" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/></svg>
                <span>Search</span>
            </button>
        </div>
        <div class="sidebar-history">
            <h2>Recent searches</h2>
            <div id="sidebarHistoryList" class="history-list"></div>
        </div>
    </aside>

    <div id="searchModal" class="search-modal hidden" aria-hidden="true" role="dialog" aria-modal="true">
        <div class="modal-overlay" data-close="true"></div>
        <div class="modal-box">
            <div class="modal-header">
                <span>Search</span>
                <button id="searchModalClose" class="modal-close" type="button" aria-label="Close search dialog">×</button>
            </div>
            <textarea id="sidebarModalQueryInput" rows="1" placeholder="Type here to search..." autocomplete="off"></textarea>
            <div class="modal-platforms">
                <button id="sidebarSearchFindBtn" type="button">Find</button>
                <button id="sidebarSearchClearBtn" type="button">Clear</button>
            </div>
        </div>
    </div>
`;

export const mountSidebarParts = (): void => {
    const host = document.getElementById('sidebarParts');
    if (!host || host.childElementCount > 0) return;
    host.innerHTML = sidebarPartsHtml;
};

export default sidebarPartsHtml;