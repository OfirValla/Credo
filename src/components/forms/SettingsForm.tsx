import { useTranslation } from 'react-i18next';
import { ThemeSelect } from '../ThemeSelect';
import { LanguageSelect } from '../LanguageSelect';
import { ClearCache } from '../ClearCache';

export function SettingsForm() {
    const { t } = useTranslation('common');

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-sm font-medium">
                    {t('theme.label')}
                </label>
                <ThemeSelect />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">
                    {t('language.label')}
                </label>
                <LanguageSelect className="w-full" />
            </div>

            <div className="space-y-2 border-t border-border pt-6">
                <ClearCache />
            </div>
        </div>
    );
}
