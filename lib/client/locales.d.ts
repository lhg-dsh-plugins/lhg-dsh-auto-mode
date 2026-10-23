/** Locale namespace owned by the Sandbox Auto permission client. */
export declare const AUTO_MODE_LOCALE_NAMESPACE = "dsh-auto-mode.permission";
/** Simplified Chinese copy for every plugin-owned permission surface. */
export declare const zh: {
    'preset.label': string;
    'preset.description': string;
    'dialog.title': string;
    'dialog.description': string;
    'dialog.acknowledge': string;
    'dialog.cancel': string;
    'dialog.confirm': string;
    'dialog.close': string;
};
/** Locale keys consumed by the compatibility layer. */
export type AutoModeLocaleKey = keyof typeof zh;
/** English copy, checked against the Chinese source key set. */
export declare const en: {
    'preset.label': string;
    'preset.description': string;
    'dialog.title': string;
    'dialog.description': string;
    'dialog.acknowledge': string;
    'dialog.cancel': string;
    'dialog.confirm': string;
    'dialog.close': string;
};
/** Stable translation function passed from the official locale service. */
export type AutoModeTranslate = (key: AutoModeLocaleKey) => string;
/** English fallback for direct use outside an assembled DSH client. */
export declare const translateEnglish: AutoModeTranslate;
//# sourceMappingURL=locales.d.ts.map