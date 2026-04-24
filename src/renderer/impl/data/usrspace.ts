export type Platform =
    | 'google'
    | 'youtube'
    | 'threads'
    | 'facebook'
    | 'pinterest'
    | 'github'
    | 'instagram';

export const baseUrls: Record<Platform, string> = {
    google: 'https://www.google.com/search',
    youtube: 'https://www.youtube.com/results',
    threads: 'https://www.threads.net/search',
    facebook: 'https://www.facebook.com/search/top',
    pinterest: 'https://www.pinterest.com/search/pins',
    github: 'https://github.com/search',
    instagram: 'https://www.instagram.com/explore/search/keyword/',
};