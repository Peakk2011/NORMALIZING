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
                <span>Launch</span>
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
        <div class="c-sidebar-footer">
            <button id="sidebar-settings-btn" class="c-sidebar-settings-btn" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentcolor"><path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"/></svg>
                <span>Settings</span>
            </button>
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

    <div id="settings-modal" class="c-settings-modal u-hidden" aria-hidden="true" role="dialog" aria-modal="true">
        <div class="c-settings-overlay" data-settings-close="true"></div>
            <div class="c-settings-panel">
            <div class='c-settings-modal-titlebar'>
                <h1>Settings</h1>
            </div>
            <div class="c-settings-header">
                <div class="c-settings-menu-bar" role="tablist" aria-label="Settings sections">
                    <button class="c-settings-menu-btn is-active" type="button" role="tab" aria-selected="true" data-settings-tab="general">General</button>
                    <button class="c-settings-menu-btn" type="button" role="tab" aria-selected="false" data-settings-tab="styling">Styling</button>
                    <button class="c-settings-menu-btn" type="button" role="tab" aria-selected="false" data-settings-tab="search">Search</button>
                    <button class="c-settings-menu-btn" type="button" role="tab" aria-selected="false" data-settings-tab="history">History</button>
                    <button class="c-settings-menu-btn" type="button" role="tab" aria-selected="false" data-settings-tab="about">About</button>
                </div>
                <button id="settings-modal-close" class="c-settings-close" type="button" aria-label="Close settings dialog"><span>&times;</span></button>
            </div>
            <div class="c-settings-body">
                <section class="c-settings-section is-active" data-settings-panel="general" data-motion="up">
                    <div class="c-settings-row">
                        <div class="c-settings-copy">
                            <h4>Restore Sidebar</h4>
                            <p>Restore the sidebar automatically on larger screens.</p>
                        </div>
                        <label class="c-settings-switch">
                            <input id="settings-restore-sidebar-toggle" type="checkbox" />
                            <span class="c-settings-switch-ui"></span>
                        </label>
                    </div>
                    <div class="c-settings-row">
                        <div class="c-settings-copy">
                            <h4>Language</h4>
                            <p>Additional languages will be added later.</p>
                        </div>
                    </div>
                    <div class="c-settings-chip-row">
                        <span class="c-settings-chip is-active">English</span>
                        <span class="c-settings-chip">Thai soon</span>
                    </div>
                </section>
                <section class="c-settings-section" data-settings-panel="styling" data-motion="up">
                    <div class="c-settings-row c-settings-row-stack">
                        <div class="c-settings-copy">
                            <h4>Theme</h4>
                            <p>Choose how Normalizing should look.</p>
                        </div>
                    </div>
                    <div class="c-theme-choice-list">
                        <button class="c-theme-choice-btn" type="button" data-theme-choice="light">Light</button>
                        <button class="c-theme-choice-btn" type="button" data-theme-choice="dark">Dark</button>
                    </div>
                    <div class="c-settings-row">
                        <div class="c-settings-copy">
                            <h4>Compact Sidebar</h4>
                            <p>Use a tighter sidebar layout on screens wider than 768px.</p>
                        </div>
                        <label class="c-settings-switch">
                            <input id="settings-compact-sidebar-toggle" type="checkbox" />
                            <span class="c-settings-switch-ui"></span>
                        </label>
                    </div>
                </section>
                <section class="c-settings-section" data-settings-panel="search" data-motion="up">
                    <div class="c-settings-row c-settings-row-stack">
                        <div class="c-settings-copy">
                            <h4>Default Platform</h4>
                            <p>Used when you press Enter from the main search input.</p>
                        </div>
                    </div>
                    <div class="c-settings-search-platforms">
                        <button class="c-settings-chip c-settings-platform-btn" type="button" data-default-platform="google">Google</button>
                        <button class="c-settings-chip c-settings-platform-btn" type="button" data-default-platform="youtube">YouTube</button>
                        <button class="c-settings-chip c-settings-platform-btn" type="button" data-default-platform="threads">Threads</button>
                        <button class="c-settings-chip c-settings-platform-btn" type="button" data-default-platform="instagram">Instagram</button>
                        <button class="c-settings-chip c-settings-platform-btn" type="button" data-default-platform="facebook">Facebook</button>
                        <button class="c-settings-chip c-settings-platform-btn" type="button" data-default-platform="github">GitHub</button>
                        <button class="c-settings-chip c-settings-platform-btn" type="button" data-default-platform="pinterest">Pinterest</button>
                    </div>
                </section>
                <section class="c-settings-section" data-settings-panel="history" data-motion="up">
                    <div class="c-settings-row c-settings-row-stack">
                        <div class="c-settings-copy">
                            <h4>Recent Searches</h4>
                            <p id="settings-history-summary">Manage your recent and pinned search items.</p>
                        </div>
                    </div>
                    <div class="c-settings-chip-row">
                        <button id="settings-clear-recent-btn" class="c-settings-chip c-settings-action-pill" type="button">Clear Recent</button>
                        <button id="settings-clear-all-history-btn" class="c-settings-chip c-settings-action-pill is-danger" type="button">Clear All</button>
                    </div>
                </section>
                <section class="c-settings-section" data-settings-panel="about" data-motion="up">
                    <div class="c-settings-row c-settings-row-stack">
                        <div class="c-settings-copy c-settings-about-copy">
                            <img src="./assets/logo/application_icon.png" alt="Normalizing app icon" class="c-settings-about-icon">
                            <h4>NORMALIZING</h4>
                            <p>Version 1.0.0</p>
                            <div class="c-settings-about-links">
                                <a class="c-settings-about-link" href="https://github.com/Peakk2011/NORMALIZING" target="_blank" rel="noreferrer">An app created by Peakk</a>
                                <a class="c-settings-about-link" href="https://github.com/Peakk2011/NORMALIZING/releases/tag/1.0.0" target="_blank" rel="noreferrer">View release and project details</a>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    </div>
`;

export const mountSidebarParts = (): void => {
    const host = document.getElementById('sidebar-parts');
    if (!host || host.childElementCount > 0) return;
    host.innerHTML = sidebarPartsHtml;
};

export default sidebarPartsHtml;