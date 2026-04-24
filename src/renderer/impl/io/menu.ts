const menuEl = document.getElementById('platformMenu') as HTMLDivElement | null;
const menuBtn = document.getElementById('menuBtn') as HTMLButtonElement | null;

export const closeMenu = (): void => {
    menuEl?.classList.add('hidden');
};

const initMenu = (): void => {
    if (!menuBtn || !menuEl) return;

    menuBtn.addEventListener('click', (event: MouseEvent) => {
        event.stopPropagation();
        menuEl.classList.toggle('hidden');
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