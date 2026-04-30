export const openSidebar = (sidebar: HTMLElement, renderHistory: () => void): void => {
    sidebar.classList.remove('u-hidden');
    renderHistory();
    requestAnimationFrame(() => {
        sidebar.classList.add('is-open');
    });
};

export const closeSidebar = (sidebar: HTMLElement): void => {
    sidebar.classList.remove('is-open');
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