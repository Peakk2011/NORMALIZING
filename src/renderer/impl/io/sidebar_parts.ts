const sidebarPartsHtml = `
    <aside id="history-sidebar" class="c-history-sidebar u-hidden" aria-hidden="true">
        <div class="c-sidebar-header">
            <h1 class="c-sidebar-logo">NORMALIZING</h1>
            <button id="sidebar-close" class="c-sidebar-close" type="button" aria-label="Close sidebar">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M3.5875 19.4125C3.97917 19.8042 4.45 20 5 20L19.0875 20C19.6375 20 20.1083 19.8042 20.5 19.4125C20.8917 19.0208 21.0875 18.55 21.0875 18V6C21.0875 5.45 20.8917 4.97917 20.5 4.5875C20.1083 4.19583 19.6375 4 19.0875 4H5C4.45 4 3.97917 4.19583 3.5875 4.5875C3.19583 4.97917 3 5.45 3 6V18C3 18.55 3.19583 19.0208 3.5875 19.4125ZM9 18H5V6H9V18ZM15 18H11V6H15H17L19.0875 6V18L17 18H15Z" fill="black"/>
                </svg>
            </button>
        </div>
        <div class="c-sidebar-toolbar">
            <button id="sidebar-new-btn" class="c-sidebar-action-btn" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/></svg>
                <span>New</span>
            </button>
            <button id="sidebar-search-btn" class="c-sidebar-action-btn c-sidebar-action-secondary" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/></svg>
                <span>Search</span>
            </button>
        </div>
        <div class="c-sidebar-history">
            <h2>Recent</h2>
            <div id="sidebar-history-list" class="c-history-list"></div>
        </div>
    </aside>

    <div id="search-modal" class="c-search-modal u-hidden" aria-hidden="true" role="dialog" aria-modal="true">
        <div class="c-modal-overlay" data-close="true"></div>
        <div class="c-modal-box">
            <div class="c-modal-toolbar">
                <div class="c-modal-platforms">
                    <button id="sidebar-search-find-btn" type="button">Find</button>
                    <button id="sidebar-search-clear-btn" type="button">Clear</button>
                </div>
                <button id="search-modal-close" class="c-modal-close" type="button" aria-label="Close search dialog">&times;</button>
            </div>
            <textarea id="sidebar-modal-query-input" class="c-sidebar-modal-query-input" rows="1" placeholder="Search.." autocomplete="off"></textarea>
        </div>
    </div>
`;

export const mountSidebarParts = (): void => {
    const host = document.getElementById('sidebar-parts');
    if (!host || host.childElementCount > 0) return;
    host.innerHTML = sidebarPartsHtml;
};

export default sidebarPartsHtml;