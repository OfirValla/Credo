import { createContext, useContext, ReactNode, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { MortgagePortfolio } from '@/types';

interface PortfolioContextType {
    portfolios: MortgagePortfolio[];
    currentPortfolioId: string;
    addPortfolio: (name: string, color?: string, icon?: string, type?: "mortgage" | "loan") => string;
    removePortfolio: (id: string) => void;
    updatePortfolio: (id: string, updates: Partial<MortgagePortfolio>) => void;
    setCurrentPortfolioId: (id: string) => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: ReactNode }) {
    const [portfolios, setPortfolios] = useLocalStorage<MortgagePortfolio[]>('portfolios', []);
    const [currentPortfolioId, setCurrentPortfolioId] = useLocalStorage<string>('current_portfolio_id', '');

    if (!currentPortfolioId || (currentPortfolioId !== 'overview' && !portfolios.find(p => p.id === currentPortfolioId))) {
        setCurrentPortfolioId('overview');
    }

    const addPortfolio = useCallback((name: string, color?: string, icon?: string, type?: "mortgage" | "loan") => {
        const newPortfolio: MortgagePortfolio = {
            id: `${Date.now()}`,
            type: type || 'mortgage',
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

        const newPortfolios = portfolios.filter(p => p.id !== id);
        setPortfolios(newPortfolios);

        if (currentPortfolioId === id) {
            setCurrentPortfolioId(newPortfolios[0].id);
        }

        if (portfolioToDelete?.type === 'mortgage') {
            localStorage.removeItem(`mortgage-plans-${id}`);
            localStorage.removeItem(`mortgage-extra-payments-${id}`);
            localStorage.removeItem(`mortgage-rate-changes-${id}`);
            localStorage.removeItem(`mortgage-grace-periods-${id}`);
            localStorage.removeItem(`mortgage-currency-${id}`);
        }
    }, [portfolios, currentPortfolioId, setPortfolios, setCurrentPortfolioId]);

    const updatePortfolio = useCallback((id: string, updates: Partial<MortgagePortfolio>) => {
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
        <PortfolioContext.Provider value={value}>
            {children}
        </PortfolioContext.Provider>
    );
}

export function usePortfolios() {
    const context = useContext(PortfolioContext);
    if (context === undefined) {
        throw new Error('usePortfolios must be used within a PortfolioProvider');
    }
    return context;
}

export function useCurrentPortfolio() {
    const context = useContext(PortfolioContext);
    if (context === undefined) {
        throw new Error('useCurrentPortfolio must be used within a PortfolioProvider');
    }
    const { currentPortfolioId, portfolios } = context;
    return portfolios.find(p => p.id === currentPortfolioId)!;
}
