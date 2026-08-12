import { Visualizer } from '../../../visualizer/visualizer.js';
import { translate } from '../io/i18n.js';
import type { Platform } from '../data/usrspace.js';
import { baseUrls } from '../data/usrspace.js';

const mkReqUrl = (platform: Platform, query: string): string | null => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
        void Visualizer({ title: translate('search.inputRequired') });
        return null;
    }

    const encodedQuery = encodeURIComponent(trimmedQuery);

    switch (platform) {
        case 'google':
            return `${baseUrls.google}?q=${encodedQuery}`;
        case 'youtube':
            return `${baseUrls.youtube}?search_query=${encodedQuery}`;
        case 'threads':
        case 'facebook':
        case 'pinterest':
            return `${baseUrls[platform]}?q=${encodedQuery}`;
        case 'github':
            return `${baseUrls.github}?q=${encodedQuery}`;
        case 'instagram':
            return `${baseUrls.instagram}?q=${encodedQuery}`;
        default:
            return null;
    }
};

export default mkReqUrl;