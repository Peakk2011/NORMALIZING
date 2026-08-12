export type Locale = 'en' | 'th';
export type TranslationParams = Record<string, string | number | boolean>;

const LANGUAGE_KEY = 'normalizingLanguagePreference';
const DEFAULT_LOCALE: Locale = 'en';

const isLocale = (value: unknown): value is Locale =>
    value === 'en' || value === 'th';

const formatTranslation = (template: string, params?: TranslationParams): string => {
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (match, name) => {
        const value = params[name];
        return value === undefined ? match : String(value);
    });
};

const translations: Record<Locale, Record<string, string>> = {
    en: {
        'document.title': 'Normalizing',
        'index.searchPlaceholder': 'Type here to search...',
        'index.searchHint': 'Type your message and select your platform.',
        'url.pageTitle': 'Search Results',
        'url.searchPlaceholder': 'Search or paste URL',
        'url.openHistorySidebar': 'Open history sidebar',
        'url.refreshCurrentPage': 'Refresh current page',
        'url.cannotDisplay.title': 'Cannot Display Content in Browser',
        'url.cannotDisplay.message': 'This page cannot be embedded in a browser due to security restrictions. Click the button below to open the result in a new tab.',
        'url.openInNewTab': 'Open in New Tab',
        'url.error.couldNotOpen': 'This URL could not be opened.',
        'url.error.connectionTimedOut': 'Connection timed out while opening:\n{query}',
        'url.error.noInternet': 'No internet connection.\nUnable to open:\n{query}',
        'url.error.invalidAddress': 'The address is invalid.',
        'sidebar.closeAriaLabel': 'Close sidebar',
        'sidebar.openAriaLabel': 'Open history sidebar',
        'sidebar.launch': 'Launch',
        'sidebar.search': 'Search',
        'sidebar.recent': 'Recent',
        'sidebar.settings': 'Settings',
        'searchModal.find': 'Find',
        'searchModal.clear': 'Clear',
        'searchModal.closeAriaLabel': 'Close search dialog',
        'searchModal.placeholder': 'Search..',
        'settings.title': 'Settings',
        'settings.tabs.general': 'General',
        'settings.tabs.styling': 'Styling',
        'settings.tabs.search': 'Search',
        'settings.tabs.history': 'History',
        'settings.tabs.about': 'About',
        'settings.restoreSidebar': 'Restore Sidebar',
        'settings.restoreSidebarDescription': 'Restore the sidebar automatically on larger screens.',
        'settings.language': 'Language',
        'settings.languageDescription': 'Switch the app language',
        'settings.languageOptionEnglish': 'English',
        'settings.languageOptionThai': 'ไทย',
        'settings.theme': 'Theme',
        'settings.themeDescription': 'Choose how Normalizing should look.',
        'settings.theme.system': 'System Default',
        'settings.theme.light': 'Light',
        'settings.theme.dark': 'Dark',
        'settings.compactSidebar': 'Compact Sidebar',
        'settings.compactSidebarDescription': 'Compact sidebar on wide screens.',
        'settings.defaultPlatform': 'Default Platform',
        'settings.defaultPlatformDescription': 'Used when you press Enter from the main search input.',
        'settings.recentSearches': 'Recent Searches',
        'settings.recentSearchesDescription': 'Manage your recent and pinned search items.',
        'settings.clearRecent': 'Clear Recent',
        'settings.clearAll': 'Clear All',
        'settings.version': 'Version 1.0.0',
        'settings.closeAriaLabel': 'Close settings dialog',
        'sidebar.aboutIconAlt': 'Normalizing app icon',
        'history.empty': 'No recent searches yet.',
        'history.directUrl': 'Direct URL',
        'history.itemActions': 'History item actions',
        'history.copyUrl': 'Copy URL',
        'history.editSearch': 'Edit Search',
        'history.delete': 'Delete',
        'history.renameAriaLabel': 'Rename history item',
        'history.copiedUrl': 'Copied URL.',
        'history.copyFailedTitle': 'Copy failed.',
        'history.copyFailedMessage': 'Unable to copy this URL right now.',
        'history.renameFailedTitle': 'Rename failed.',
        'history.renameFailedMessage': 'Please enter a valid name for this history item.',
        'visualizer.confirm': 'Confirm',
        'history.summary': '{recentCount} recent item{recentPlural} and {pinnedCount} pinned item{pinnedPlural}.',
        'search.inputRequired': 'Type your message and select your platform.',
    },
    th: {
        'document.title': 'NORMALIZING',
        'index.searchPlaceholder': 'พิมพ์ที่นี้เพื่อค้นหา',
        'index.searchHint': 'พิมพ์ข้อความและเลือกแพลตฟอร์มที่ต้องการ',
        'url.pageTitle': 'ผลการค้นหา',
        'url.searchPlaceholder': 'ค้นหาหรือวาง URL',
        'url.openHistorySidebar': 'เปิดแถบประวัติ',
        'url.refreshCurrentPage': 'รีเฟรชหน้านี้',
        'url.cannotDisplay.title': 'ไม่สามารถแสดงเนื้อหานี้ได้',
        'url.cannotDisplay.message': 'ไม่สามารถแสดงหน้านี้ในเบราว์เซอร์ได้เนื่องจากข้อจำกัดด้านความปลอดภัย โปรดเปิดผลลัพธ์ในแท็บใหม่แทน',
        'url.openInNewTab': 'เปิดในแท็บใหม่',
        'url.error.couldNotOpen': 'ไม่สามารถเปิด URL นี้ได้',
        'url.error.connectionTimedOut': 'หมดเวลาการเชื่อมต่อขณะเปิด:\n{query}',
        'url.error.noInternet': 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต\nไม่สามารถเปิด {query} ได้',
        'url.error.invalidAddress': 'ที่อยู่นี้ไม่ถูกต้อง โปรดตรวจสอบแล้วลองอีกครั้ง',
        'sidebar.closeAriaLabel': 'ปิดแถบด้านข้าง',
        'sidebar.openAriaLabel': 'เปิดแถบประวัติ',
        'sidebar.launch': 'สร้าง',
        'sidebar.search': 'ค้นหา',
        'sidebar.recent': 'ล่าสุด',
        'sidebar.settings': 'การตั้งค่า',
        'searchModal.find': 'ค้นหา',
        'searchModal.clear': 'ล้าง',
        'searchModal.closeAriaLabel': 'ปิดกล่องโต้ตอบการค้นหา',
        'searchModal.placeholder': 'ค้นหา',
        'settings.title': 'การตั้งค่า',
        'settings.tabs.general': 'ทั่วไป',
        'settings.tabs.styling': 'รูปแบบ',
        'settings.tabs.search': 'การค้นหา',
        'settings.tabs.history': 'ประวัติ',
        'settings.tabs.about': 'เกี่ยวกับ',
        'settings.restoreSidebar': 'เรียกคืนแถบด้านข้าง',
        'settings.restoreSidebarDescription': 'เรียกคืนแถบด้านข้างเมื่อใช้งานบนหน้าจอขนาดใหญ่',
        'settings.language': 'ภาษา',
        'settings.languageDescription': 'เปลี่ยนภาษาที่ใช้แสดงผล',
        'settings.languageOptionEnglish': 'English',
        'settings.languageOptionThai': 'ไทย',
        'settings.theme': 'ธีม',
        'settings.themeDescription': 'เลือกลักษณะการแสดงผลของ Normalizing',
        'settings.theme.system': 'ค่าเริ่มต้นของระบบ',
        'settings.theme.light': 'สว่าง',
        'settings.theme.dark': 'มืด',
        'settings.compactSidebar': 'แถบด้านข้างแบบกะทัดรัด',
        'settings.compactSidebarDescription': 'ใช้รูปแบบแถบด้านข้างที่กระชับขึ้นบนหน้าจอที่กว้าง',
        'settings.defaultPlatform': 'แพลตฟอร์มเริ่มต้น',
        'settings.defaultPlatformDescription': 'แพลตฟอร์มที่จะใช้เมื่อกด Enter จากช่องค้นหาหลัก',
        'settings.recentSearches': 'การค้นหาล่าสุด',
        'settings.recentSearchesDescription': 'จัดการรายการค้นหาล่าสุดและรายการที่ปักหมุดไว้',
        'settings.clearRecent': 'ล้างรายการล่าสุด',
        'settings.clearAll': 'ล้างทั้งหมด',
        'settings.version': 'เวอร์ชัน 1.0.0',
        'settings.closeAriaLabel': 'ปิดกล่องโต้ตอบการตั้งค่า',
        'sidebar.aboutIconAlt': 'ไอคอนแอป Normalizing',
        'history.empty': 'ยังไม่มีประวัติการค้นหา',
        'history.directUrl': 'URL โดยตรง',
        'history.itemActions': 'การดำเนินการของรายการประวัติ',
        'history.copyUrl': 'คัดลอก URL',
        'history.editSearch': 'แก้ไขการค้นหา',
        'history.delete': 'ลบ',
        'history.renameAriaLabel': 'เปลี่ยนชื่อรายการประวัติ',
        'history.copiedUrl': 'คัดลอก URL แล้ว',
        'history.copyFailedTitle': 'ไม่สามารถคัดลอกได้',
        'history.copyFailedMessage': 'ไม่สามารถคัดลอก URL นี้ได้ในขณะนี้ โปรดลองอีกครั้ง',
        'history.renameFailedTitle': 'ไม่สามารถเปลี่ยนชื่อได้',
        'history.renameFailedMessage': 'โปรดป้อนชื่อที่ถูกต้องสำหรับรายการประวัตินี้',
        'visualizer.confirm': 'ตกลง',
        'history.summary': '{recentCount} รายการล่าสุด และ {pinnedCount} รายการที่ปักหมุดไว้',
        'search.inputRequired': 'โปรดพิมพ์ข้อความและเลือกแพลตฟอร์มที่ต้องการ',
    },
};

export const getLanguagePreference = (): Locale => {
    try {
        const raw = localStorage.getItem(LANGUAGE_KEY);
        return isLocale(raw) ? raw : DEFAULT_LOCALE;
    } catch { 
        return DEFAULT_LOCALE;
    }
};

export const setLanguagePreference = (locale: Locale): void => {
    const next = isLocale(locale) ? locale : DEFAULT_LOCALE;
    try {
        localStorage.setItem(LANGUAGE_KEY, next);
    } catch {
        // ignore storage failures
    }
    applyTranslations();
};

export const translate = (key: string, params?: TranslationParams): string => {
    const locale = getLanguagePreference();
    const bundle = translations[locale] ?? translations[DEFAULT_LOCALE];
    const template = bundle[key] ?? translations[DEFAULT_LOCALE][key] ?? key;
    return formatTranslation(template, params);
};

export const applyTranslations = (): void => {
    const locale = getLanguagePreference();
    document.documentElement.lang = locale;
    document.documentElement.dataset.lang = locale;

    document.querySelectorAll<HTMLElement>('[data-i18n-key]').forEach((element) => {
        const key = element.dataset.i18nKey;
        if (!key) return;
        element.textContent = translate(key);
    });

    document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-i18n-placeholder]').forEach((element) => {
        const key = element.dataset.i18nPlaceholder;
        if (!key) return;
        element.placeholder = translate(key);
    });

    document.querySelectorAll<HTMLElement>('[data-i18n-aria-label]').forEach((element) => {
        const key = element.dataset.i18nAriaLabel;
        if (!key) return;
        element.setAttribute('aria-label', translate(key));
    });

    document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((element) => {
        const key = element.dataset.i18nTitle;
        if (!key) return;
        element.setAttribute('title', translate(key));
    });

    document.querySelectorAll<HTMLElement>('[data-i18n-alt]').forEach((element) => {
        const key = element.dataset.i18nAlt;
        if (!key) return;
        element.setAttribute('alt', translate(key));
    });
};

export const initI18n = (): void => {
    applyTranslations();
};
