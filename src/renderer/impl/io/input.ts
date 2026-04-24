const initInput = (): void => {
    const queryInput = document.getElementById('queryInput') as HTMLTextAreaElement | null;
    if (!queryInput) return;

    const resize = (): void => {
        queryInput.style.height = 'auto';
        queryInput.style.height = `${Math.min(queryInput.scrollHeight, 160)}px`;
    };

    queryInput.addEventListener('input', resize);
    resize();
};

export default initInput;