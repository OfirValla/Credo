import 'react-i18next';

// Import English JSON for type safety
import dashboard from '../../public/locales/en/dashboard.json';
import portfolioPage from '../../public/locales/en/portfolio-page.json';
import settings from '../../public/locales/en/settings.json';

declare module 'react-i18next' {
    interface CustomTypeOptions {
        defaultNS: 'dashboard';
        resources: {
            dashboard: typeof dashboard;
            'portfolio-page': typeof portfolioPage;
            settings: typeof settings;
        };
    }
}
