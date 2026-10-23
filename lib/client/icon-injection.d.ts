import { type AutoModeTranslate } from './locales.js';
/** Register one locale-change listener and return its disposer. */
export type AutoModeLocaleSubscribe = (listener: () => void) => () => void;
/** Localize and mark the official Auto permission surfaces for CSS decoration. */
export declare function decorateAutoPermissionIcons(document: Document, t?: AutoModeTranslate): void;
/** Install the localized Auto UI and explicit risk gate, then return their disposer. */
export declare function installAutoPermissionIcon(document: Document, t?: AutoModeTranslate, subscribe?: AutoModeLocaleSubscribe): () => void;
//# sourceMappingURL=icon-injection.d.ts.map