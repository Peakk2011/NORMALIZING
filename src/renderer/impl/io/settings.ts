import type { Platform } from '../data/usrspace.js';

export type SidebarRestorePreference = boolean;
export type CompactSidebarPreference = boolean;

const DEFAULT_PLATFORM_KEY = 'normalizingDefaultPlatform';
const COMPACT_SIDEBAR_KEY = 'normalizingCompactSidebar';
const RESTORE_SIDEBAR_KEY = 'normalizingRestoreSidebar';

const validPlatforms: Platform[] = ['google', 'youtube', 'threads', 'facebook', 'pinterest', 'github', 'instagram'];

export const getDefaultPlatform = (): Platform => {
    try {
        const raw = localStorage.getItem(DEFAULT_PLATFORM_KEY);
        return validPlatforms.includes(raw as Platform) ? (raw as Platform) : 'google';
    } catch {
        return 'google';
    }
};

export const setDefaultPlatform = (platform: Platform): void => {
    const next = validPlatforms.includes(platform) ? platform : 'google';
    try {
        localStorage.setItem(DEFAULT_PLATFORM_KEY, next);
    } catch {
        // ignore storage failures
    }
};

export const getCompactSidebarPreference = (): CompactSidebarPreference => {
    try {
        return localStorage.getItem(COMPACT_SIDEBAR_KEY) === 'true';
    } catch {
        return false;
    }
};

export const setCompactSidebarPreference = (enabled: CompactSidebarPreference): void => {
    try {
        localStorage.setItem(COMPACT_SIDEBAR_KEY, String(enabled));
    } catch {
        // ignore storage failures
    }
};

export const applyCompactSidebarPreference = (): void => {
    document.documentElement.classList.toggle('has-compact-sidebar', getCompactSidebarPreference());
};

export const getRestoreSidebarPreference = (): SidebarRestorePreference => {
    try {
        const raw = localStorage.getItem(RESTORE_SIDEBAR_KEY);
        return raw === null ? true : raw === 'true';
    } catch {
        return true;
    }
};

export const setRestoreSidebarPreference = (enabled: SidebarRestorePreference): void => {
    try {
        localStorage.setItem(RESTORE_SIDEBAR_KEY, String(enabled));
    } catch {
        // ignore storage failures
    }
};