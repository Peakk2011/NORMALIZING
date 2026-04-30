const menuEl = document.getElementById('platform-menu') as HTMLDivElement | null;
const menuBtn = document.getElementById('menu-btn') as HTMLButtonElement | null;

export const closeMenu = (): void => {
    menuEl?.classList.add('u-hidden');
};

const initMenu = (): void => {
    if (!menuBtn || !menuEl) return;

    menuBtn.addEventListener('click', (event: MouseEvent) => {
        event.stopPropagation();
        menuEl.classList.toggle('u-hidden');
    });

    menuEl.addEventListener('click', (event: MouseEvent) => {
        event.stopPropagation();
    });

    document.addEventListener('click', (event: MouseEvent) => {
        const target = event.target as Node | null;
        if (!target) return;
        if (!menuEl.contains(target) && !menuBtn.contains(target)) {
            closeMenu();
        }
    });
};

export default initMenu;