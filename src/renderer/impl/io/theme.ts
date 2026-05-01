export type ThemePreference = "system" | "light" | "dark";

const THEME_KEY = "normalizingThemePreference";
const DARK_QUERY = "(prefers-color-scheme: dark)";

const isThemePreference = (value: unknown): value is ThemePreference =>
    value === "system" || value === "light" || value === "dark";

const getSystemTheme = (): "light" | "dark" =>
    window.matchMedia(DARK_QUERY).matches ? "dark" : "light";

export const getThemePreference = (): ThemePreference => {
    try {
        const raw = localStorage.getItem(THEME_KEY);
        return isThemePreference(raw) ? raw : "system";
    } catch {
        return "system";
    }
};

export const getResolvedTheme = (preference: ThemePreference): "light" | "dark" =>
    preference === "system" ? getSystemTheme() : preference;

export const applyTheme = (preference: ThemePreference): void => {
    const resolved = getResolvedTheme(preference);
    document.documentElement.dataset.theme = resolved;
};

export const setThemePreference = (preference: ThemePreference): void => {
    const next = isThemePreference(preference) ? preference : "system";
    try {
        localStorage.setItem(THEME_KEY, next);
    } catch {
        // ignore storage failures and still apply in-memory preference
    }
    applyTheme(next);
    window.electronAPI?.setTheme?.(next);
};

export const initTheme = (): void => {
    const preference = getThemePreference();
    applyTheme(preference);
    window.electronAPI?.setTheme?.(preference);

    const media = window.matchMedia(DARK_QUERY);
    media.addEventListener("change", () => {
        if (getThemePreference() !== "system") return;
        applyTheme("system");
        window.electronAPI?.setTheme?.("system");
    });
};