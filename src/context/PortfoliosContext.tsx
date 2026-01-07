import { createContext, useContext, ReactNode, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ExportPortfolio, Portfolio, PortfolioType } from '@/types';
import { toast } from 'react-toastify';
import { t } from 'i18next';
import { useNavigate } from 'react-router';
import { PORTFOLIO_COLORS } from '@/lib/constants';
import { CurrencyCode } from '@/lib/currency';

interface PortfoliosContextType {
    portfolios: Portfolio[];
    addPortfolio: (name: string, color?: string, icon?: string, type?: PortfolioType) => string;
    addMultiplePortfolios: (items: Portfolio[]) => string[];
    removePortfolio: (id: string) => void;
    removeAllPortfolios: () => void;
    updatePortfolio: (id: string, updates: Partial<Portfolio>) => void;
    importPortfolio: (data: any) => string | null;
    exportAllPortfolios: () => void;
}

const PortfoliosContext = createContext<PortfoliosContextType | undefined>(undefined);

export function PortfoliosProvider({ children }: { children: ReactNode }) {
    const [portfolios, setPortfolios] = useLocalStorage<Portfolio[]>('portfolios', []);
    const navigate = useNavigate();

    const addPortfolio = useCallback(
        (name: string, color?: string, icon?: string, type?: PortfolioType) => {
            const newPortfolio: Portfolio = {
                id: `${Date.now()}`,
                type: type ?? PortfolioType.MORTGAGE,
                name,
                createdAt: Date.now(),
                color: color ?? 'bg-blue-500',
                icon,
            };

            setPortfolios(prev => [...prev, newPortfolio]);
            return newPortfolio.id;
        },
        [setPortfolios]
    );

    const addMultiplePortfolios = useCallback((items: Portfolio[]) => {
        const newPortfolios = items.map(p => ({
            id: p.id,
            type: p.type ?? PortfolioType.MORTGAGE,
            name: p.name,
            createdAt: Date.now(),
            color: p.color ?? 'bg-blue-500',
            icon: p.icon,
        }));

        setPortfolios(prev => [...prev, ...newPortfolios]);

        return newPortfolios.map(p => p.id);
    }, []);

    const removePortfolio = useCallback((id: string) => {
        setPortfolios(portfolios => {
            const portfolioToDelete = portfolios.find(p => p.id === id);
            if (!portfolioToDelete) return portfolios;

            localStorage.removeItem(`${id}-plans`);
            localStorage.removeItem(`${id}-extra-payments`);
            localStorage.removeItem(`${id}-rate-changes`);
            localStorage.removeItem(`${id}-grace-periods`);
            localStorage.removeItem(`${id}-currency`);

            return portfolios.filter(p => p.id !== id);
        });
    }, [setPortfolios]);

    const removeAllPortfolios = useCallback(() => {
        setPortfolios(portfolios => {
            for (const p of portfolios) {
                localStorage.removeItem(`${p.id}-plans`);
                localStorage.removeItem(`${p.id}-extra-payments`);
                localStorage.removeItem(`${p.id}-rate-changes`);
                localStorage.removeItem(`${p.id}-grace-periods`);
                localStorage.removeItem(`${p.id}-currency`);
            }
            return [];
        });
    }, [setPortfolios]);

    const updatePortfolio = useCallback(
        (id: string, updates: Omit<Partial<Portfolio>, 'id'>) => {
            setPortfolios((portfolios: Portfolio[]) =>
                portfolios.map(p =>
                    p.id === id ? { ...p, ...updates, id: p.id } : p
                )
            );
        },
        [setPortfolios]
    );

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

    const exportAllPortfolios = () => {
        const data: ExportPortfolio[] = [];

        portfolios.forEach((portfolio) => {
            const currencyItem = localStorage.getItem(`${portfolio.id}-currency`);
            const currency: CurrencyCode = currencyItem
                ? JSON.parse(currencyItem)
                : 'ILS';

            const plans = JSON.parse(localStorage.getItem(`${portfolio.id}-plans`) ?? '[]');
            const extraPayments = JSON.parse(localStorage.getItem(`${portfolio.id}-extra-payments`) ?? '[]');
            const rateChanges = JSON.parse(localStorage.getItem(`${portfolio.id}-rate-changes`) ?? '[]');
            const gracePeriods = JSON.parse(localStorage.getItem(`${portfolio.id}-grace-periods`) ?? '[]');

            data.push({
                portfolio,
                currency,
                plans,
                extraPayments,
                rateChanges,
                gracePeriods,
            });
        });

        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();

        const a = document.createElement('a');
        a.href = url;
        a.download = `all_data_${year}-${month}-${day}.json`; // filename can stay English
        document.body.appendChild(a);
        a.click();

        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    };

    const value = {
        portfolios,
        addPortfolio,
        addMultiplePortfolios,
        removePortfolio,
        removeAllPortfolios,
        updatePortfolio,
        importPortfolio,
        exportAllPortfolios
    };

    return (
        <PortfoliosContext.Provider value={value}>
            {children}
        </PortfoliosContext.Provider>
    );
}

export function usePortfolios() {
    const context = useContext(PortfoliosContext);
    if (context === undefined) {
        throw new Error('usePortfolios must be used within a PortfoliosProvider');
    }
    return context;
}
