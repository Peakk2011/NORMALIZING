/// <reference types="electron" />

import type { Platform } from '../data/usrspace.js';
import mkReqUrl from './mk_req_url.js';
import { Visualizer } from '../../../visualizer/visualizer.js';
import type { NormalizingEnv } from '../../types/window.js';

export type HistoryPlatform = Platform | 'direct';

export interface HistoryRecord {
    platform: HistoryPlatform;
    query: string;
    timestamp: number;
    pinned?: boolean;
}

const HISTORY_KEY = 'normalizingSearchHistory';
const ACTIVE_HISTORY_KEY = 'normalizingActiveHistoryItem';

const getHistoryRecordKey = (record: Pick<HistoryRecord, 'platform' | 'query'>): string =>
    `${record.platform}::${record.query}`;

export const isLikelyUrl = (value: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) return false;

    const schemePattern = /^[a-z][a-z\d+\-.]*:\/\//i;
    const hostPattern = /^(?:[\w-]+\.)+[a-z]{2,}(?:[:/].*)?$/i;
    return schemePattern.test(trimmed) || hostPattern.test(trimmed);
};

export const makeHref = (value: string): string => {
    const trimmed = value.trim();
    if (/^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed)) {
        return trimmed;
    }
    if (/^\/\//.test(trimmed)) {
        return `https:${trimmed}`;
    }
    return `https://${trimmed}`;
};

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

export const getActiveSearchHistoryKey = (): string | null => {
    try {
        return localStorage.getItem(ACTIVE_HISTORY_KEY);
    } catch {
        return null;
    }
};

export const setActiveSearchHistory = (record: Pick<HistoryRecord, 'platform' | 'query'> | null): void => {
    try {
        if (!record) {
            localStorage.removeItem(ACTIVE_HISTORY_KEY);
            return;
        }
        localStorage.setItem(ACTIVE_HISTORY_KEY, getHistoryRecordKey(record));
    } catch {
        // ignore storage errors
    }
};

export const isActiveSearchHistory = (record: Pick<HistoryRecord, 'platform' | 'query'>): boolean =>
    getActiveSearchHistoryKey() === getHistoryRecordKey(record);

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

const addSearchHistory = (platform: HistoryPlatform, query: string): HistoryRecord | null => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return null;

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
    return nextEntry;
};

export const recordSearchHistory = (platform: HistoryPlatform, query: string): HistoryRecord | null => {
    const nextEntry = addSearchHistory(platform, query);
    if (nextEntry) {
        setActiveSearchHistory(nextEntry);
    }
    return nextEntry;
};

export const deleteSearchHistory = (record: HistoryRecord): void => {
    if (isActiveSearchHistory(record)) {
        setActiveSearchHistory(null);
    }
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

export const renameSearchHistory = (record: HistoryRecord, nextQuery: string): HistoryRecord | null => {
    const trimmedQuery = nextQuery.trim();
    if (!trimmedQuery) return null;

    const history = getSearchHistory();
    const targetIndex = history.findIndex(item => item.platform === record.platform && item.query === record.query);
    if (targetIndex === -1) return null;

    const target = history[targetIndex]!;
    const duplicateIndex = history.findIndex((item, index) =>
        index !== targetIndex && item.platform === record.platform && item.query === trimmedQuery);

    if (duplicateIndex !== -1) {
        history.splice(duplicateIndex, 1);
    }

    const renamedRecord: HistoryRecord = {
        ...target,
        query: trimmedQuery,
        timestamp: Date.now(),
    };

    history[targetIndex] = renamedRecord;
    saveSearchHistory(history);

    if (isActiveSearchHistory(record)) {
        setActiveSearchHistory(renamedRecord);
    }

    return renamedRecord;
};

const search = (platform: Platform, queryOverride?: string): void => {
    const input = getQueryInput();
    const query = (queryOverride?.trim() ?? input?.value?.trim() ?? '').trim();
    if (!query) {
        void Visualizer({ title: 'Type your message and select your platform.' });
        return;
    }

    const directUrl = isLikelyUrl(query);
    const historyPlatform: HistoryPlatform = directUrl ? 'direct' : platform;
    const url = directUrl ? makeHref(query) : mkReqUrl(platform, query);
    if (!url) return;

    recordSearchHistory(historyPlatform, query);

    const env: NormalizingEnv | undefined = window.env ?? window.__normalizingEnv;
    if (env?.isWeb) {
        window.location.href = url;
    } else {
        const urlHtmlUrl = directUrl
            ? `${window.location.origin}/url.html?target=${encodeURIComponent(query)}&query=${encodeURIComponent(query)}`
            : `${window.location.origin}/url.html?platform=${encodeURIComponent(platform)}&query=${encodeURIComponent(query)}`;
        window.location.href = urlHtmlUrl;
    }
};

export default search
