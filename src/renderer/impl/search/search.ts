/// <reference types="electron" />

import type { Platform } from '../data/usrspace.js';
import mkReqUrl from './mk_req_url.js';
import { Visualizer } from '../../../visualizer/visualizer.js';
import type { NormalizingEnv } from '../../types/window.js';

export interface HistoryRecord {
    platform: Platform;
    query: string;
    timestamp: number;
    pinned?: boolean;
}

const HISTORY_KEY = 'normalizingSearchHistory';

const isHistoryRecord = (value: unknown): value is HistoryRecord => {
    return Boolean(value
        && typeof value === 'object'
        && 'platform' in value
        && 'query' in value
        && 'timestamp' in value
        && typeof value.platform === 'string'
        && typeof value.query === 'string'
        && typeof value.timestamp === 'number');
};

const saveSearchHistory = (history: HistoryRecord[]): void => {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
        // ignore storage errors
    }
};

const getQueryInput = (): HTMLTextAreaElement | null => {
    return document.getElementById('queryInput') as HTMLTextAreaElement | null
        || document.getElementById('sidebarModalQueryInput') as HTMLTextAreaElement | null;
};

export const getSearchHistory = (): HistoryRecord[] => {
    try {
        const raw = localStorage.getItem(HISTORY_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        const normalized = parsed
            .filter(isHistoryRecord)
            .map(item => ({ ...item, pinned: Boolean(item.pinned) }));

        return normalized.sort((a, b) => {
            if (a.pinned === b.pinned) {
                return b.timestamp - a.timestamp;
            }
            return a.pinned ? -1 : 1;
        });
    } catch {
        return [];
    }
};

const addSearchHistory = (platform: Platform, query: string): void => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    const history = getSearchHistory();
    const existingIndex = history.findIndex(item => item.platform === platform && item.query === trimmedQuery);
    const existingPinned = existingIndex !== -1 ? Boolean(history[existingIndex]!.pinned) : false;

    if (existingIndex !== -1) {
        history.splice(existingIndex, 1);
    }

    const nextEntry: HistoryRecord = {
        platform,
        query: trimmedQuery,
        timestamp: Date.now(),
        pinned: existingPinned,
    };

    history.unshift(nextEntry);

    while (history.length > 12) {
        history.pop();
    }

    saveSearchHistory(history);
};

export const deleteSearchHistory = (record: HistoryRecord): void => {
    const history = getSearchHistory().filter(item => item.platform !== record.platform || item.query !== record.query);
    saveSearchHistory(history);
};

export const toggleSearchHistoryPinned = (record: HistoryRecord): void => {
    const history = getSearchHistory().map(item => {
        if (item.platform === record.platform && item.query === record.query) {
            return { ...item, pinned: !item.pinned };
        }
        return item;
    });
    saveSearchHistory(history);
};

const search = (platform: Platform, queryOverride?: string): void => {
    const input = getQueryInput();
    const query = (queryOverride?.trim() ?? input?.value?.trim() ?? '').trim();
    if (!query) {
        void Visualizer({ title: 'Type your message and select your platform.' });
        return;
    }

    const url = mkReqUrl(platform, query);
    if (!url) return;

    addSearchHistory(platform, query);

    const env: NormalizingEnv | undefined = window.env ?? window.__normalizingEnv;
    if (env?.isWeb) {
        // Direct redirect for web browsers
        window.location.href = url;
    } else {
        // Navigate to url.html for Electron
        const urlHtmlUrl = `${window.location.origin}/url.html?platform=${encodeURIComponent(platform)}&query=${encodeURIComponent(query)}`;
        window.location.href = urlHtmlUrl;
    }
};

export default search