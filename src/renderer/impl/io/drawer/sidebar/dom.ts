const SIDEBAR_OPEN_CLASS = 'has-sidebar-open';

export const openSidebar = (sidebar: HTMLElement, renderHistory: () => void): void => {
    sidebar.classList.remove('u-hidden');
    renderHistory();
    requestAnimationFrame(() => {
        sidebar.classList.add('is-open');
        document.body.classList.add(SIDEBAR_OPEN_CLASS);
    });
};

export const closeSidebar = (sidebar: HTMLElement): void => {
    sidebar.classList.remove('is-open');
    document.body.classList.remove(SIDEBAR_OPEN_CLASS);
    setTimeout(() => {
        sidebar.classList.add('u-hidden');
    }, 220);
};

export const toggleSidebar = (sidebar: HTMLElement, renderHistory: () => void): void => {
    if (sidebar.classList.contains('is-open')) {
        closeSidebar(sidebar);
    } else {
        openSidebar(sidebar, renderHistory);
    }
};