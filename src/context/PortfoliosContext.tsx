import { createContext, useContext, ReactNode, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Portfolio, PortfolioType } from '@/types';

interface PortfoliosContextType {
    portfolios: Portfolio[];
    currentPortfolioId: string;
    addPortfolio: (name: string, color?: string, icon?: string, type?: PortfolioType) => string;
    removePortfolio: (id: string) => void;
    removeAllPortfolios: () => void;
    updatePortfolio: (id: string, updates: Partial<Portfolio>) => void;
    setCurrentPortfolioId: (id: string) => void;
}

const PortfoliosContext = createContext<PortfoliosContextType | undefined>(undefined);

export function PortfoliosProvider({ children }: { children: ReactNode }) {
    const [portfolios, setPortfolios] = useLocalStorage<Portfolio[]>('portfolios', []);
    const [currentPortfolioId, setCurrentPortfolioId] = useLocalStorage<string>('current_portfolio_id', '');

    const addPortfolio = useCallback((name: string, color?: string, icon?: string, type?: PortfolioType) => {
        const newPortfolio: Portfolio = {
            id: `${Date.now()}`,
            type: type || PortfolioType.MORTGAGE,
            name,
            createdAt: Date.now(),
            color: color || 'bg-blue-500',
            icon: icon
        };
        setPortfolios([...portfolios, newPortfolio]);
        return newPortfolio.id;
    }, [portfolios, setPortfolios]);

    const removePortfolio = useCallback((id: string) => {
        setPortfolios(portfolios => {
            const portfolioToDelete = portfolios.find(p => p.id === id);
            if (!portfolioToDelete) return portfolios;

            localStorage.removeItem(`${portfolioToDelete.type}-plans-${id}`);
            localStorage.removeItem(`${portfolioToDelete.type}-extra-payments-${id}`);
            localStorage.removeItem(`${portfolioToDelete.type}-rate-changes-${id}`);
            localStorage.removeItem(`${portfolioToDelete.type}-grace-periods-${id}`);
            localStorage.removeItem(`${portfolioToDelete.type}-currency-${id}`);

            return portfolios.filter(p => p.id !== id);
        });
    }, [setPortfolios]);

    const removeAllPortfolios = useCallback(() => {
        setPortfolios(portfolios => {
            for (const p of portfolios) {
                localStorage.removeItem(`${p.type}-plans-${p.id}`);
                localStorage.removeItem(`${p.type}-extra-payments-${p.id}`);
                localStorage.removeItem(`${p.type}-rate-changes-${p.id}`);
                localStorage.removeItem(`${p.type}-grace-periods-${p.id}`);
                localStorage.removeItem(`${p.type}-currency-${p.id}`);
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

    const value = {
        portfolios,
        currentPortfolioId,
        addPortfolio,
        removePortfolio,
        removeAllPortfolios,
        updatePortfolio,
        setCurrentPortfolioId,
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

export function useCurrentPortfolio() {
    const context = useContext(PortfoliosContext);
    if (context === undefined) {
        throw new Error('useCurrentPortfolio must be used within a PortfoliosProvider');
    }
    const { currentPortfolioId, portfolios } = context;
    return portfolios.find(p => p.id === currentPortfolioId)!;
}
