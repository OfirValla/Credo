import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

export const SUPPORTED_LANGUAGES = [
    {
        code: 'en',
        label: 'English',
        dir: 'ltr'
    },
    {
        code: 'he',
        label: 'עברית',
        dir: 'rtl'
    }
] as const;

export type SupportedLanguageCode =
    (typeof SUPPORTED_LANGUAGES)[number]['code'];

const DEFAULT_LANGUAGE: SupportedLanguageCode = 'en';

export const I18N_NAMESPACES = [
    'dashboard',
    'portfolio-page',
    'settings'
] as const;

export type I18nNamespace = (typeof I18N_NAMESPACES)[number];

i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: DEFAULT_LANGUAGE,
        supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),

        ns: I18N_NAMESPACES,
        defaultNS: 'dashboard',

        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json'
        },

        interpolation: {
            escapeValue: false
        },

        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage']
        }
    });

/**
 * Handle RTL/LTR automatically
 */
i18n.on('languageChanged', (lng) => {
    const lang = SUPPORTED_LANGUAGES.find((l) => l.code === lng);

    document.documentElement.dir = lang?.dir ?? 'ltr';
    document.documentElement.lang = lng;
});


export default i18n;