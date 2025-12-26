import { createContext, useContext, ReactNode, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Portfolio, PortfolioType } from '@/types';

interface PortfoliosContextType {
    portfolios: Portfolio[];
    currentPortfolioId: string;
    addPortfolio: (name: string, color?: string, icon?: string, type?: PortfolioType) => string;
    removePortfolio: (id: string) => void;
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
        if (portfolios.length <= 1) {
            alert("Cannot delete the last portfolio.");
            return;
        }

        const portfolioToDelete = portfolios.find(p => p.id === id);
        if (!portfolioToDelete)
            return;

        const newPortfolios = portfolios.filter(p => p.id !== id);
        setPortfolios(newPortfolios);

        localStorage.removeItem(`${portfolioToDelete.type}-plans-${id}`);
        localStorage.removeItem(`${portfolioToDelete.type}-extra-payments-${id}`);
        localStorage.removeItem(`${portfolioToDelete.type}-rate-changes-${id}`);
        localStorage.removeItem(`${portfolioToDelete.type}-grace-periods-${id}`);
        localStorage.removeItem(`${portfolioToDelete.type}-currency-${id}`);
    }, [portfolios, currentPortfolioId, setPortfolios, setCurrentPortfolioId]);

    const updatePortfolio = useCallback((id: string, updates: Partial<Portfolio>) => {
        setPortfolios(portfolios.map(p => p.id === id ? { ...p, ...updates } : p));
    }, [portfolios, setPortfolios]);

    const value = {
        portfolios,
        currentPortfolioId,
        addPortfolio,
        removePortfolio,
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
