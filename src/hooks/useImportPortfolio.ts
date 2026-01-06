import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { usePortfolios } from '@/context/PortfoliosContext';
import { PortfolioType } from '@/types';
import { PORTFOLIO_COLORS } from '@/lib/constants';

export function useImportPortfolio() {
    const { addPortfolio } = usePortfolios();
    const navigate = useNavigate();
    const { t } = useTranslation('common');

    const importPortfolio = (data: any) => {
        try {
            let type: PortfolioType = PortfolioType.MORTGAGE;
            let name = `${t('import.portfolio')} ${new Date().toLocaleDateString()}`;
            let color = PORTFOLIO_COLORS[Math.floor(Math.random() * PORTFOLIO_COLORS.length)];
            let icon;

            if (data.portfolio) {
                if (data.portfolio.type) type = data.portfolio.type;
                if (data.portfolio.name) name = data.portfolio.name;
                if (data.portfolio.color) color = data.portfolio.color;
                if (data.portfolio.icon) icon = data.portfolio.icon;
            } else if (data.portfolioName) {
                name = data.portfolioName;
                if (data.portfolioColor) color = data.portfolioColor;
                if (data.portfolioIcon) icon = data.portfolioIcon;
            }

            const newId = addPortfolio(name, color, icon, type);

            // Manually seed local storage for the new portfolio
            if (data.plans) localStorage.setItem(`${newId}-plans`, JSON.stringify(data.plans));
            if (data.extraPayments) localStorage.setItem(`${newId}-extra-payments`, JSON.stringify(data.extraPayments));
            if (data.rateChanges) localStorage.setItem(`${newId}-rate-changes`, JSON.stringify(data.rateChanges));
            if (data.gracePeriods) localStorage.setItem(`${newId}-grace-periods`, JSON.stringify(data.gracePeriods));
            if (data.currency) localStorage.setItem(`${newId}-currency`, JSON.stringify(data.currency));

            navigate(`/${type}/${newId}`);
            toast.success(t('import.success'));
            return newId;
        } catch (error) {
            console.error("Failed to import portfolio", error);
            toast.error(t('import.error'));
            return null;
        }
    };

    return { importPortfolio };
}
