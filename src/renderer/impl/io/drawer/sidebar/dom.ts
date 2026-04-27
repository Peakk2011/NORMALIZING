export const openSidebar = (sidebar: HTMLElement, renderHistory: () => void): void => {
    sidebar.classList.remove('hidden');
    renderHistory();
    requestAnimationFrame(() => {
        sidebar.classList.add('open');
    });
};

export const closeSidebar = (sidebar: HTMLElement): void => {
    sidebar.classList.remove('open');
    setTimeout(() => {
        sidebar.classList.add('hidden');
    }, 220);
};

export const toggleSidebar = (sidebar: HTMLElement, renderHistory: () => void): void => {
    if (sidebar.classList.contains('open')) {
        closeSidebar(sidebar);
    } else {
        openSidebar(sidebar, renderHistory);
    }
};