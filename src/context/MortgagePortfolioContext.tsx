import { createContext, useContext, ReactNode, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { MortgagePortfolio } from '@/types';

interface MortgagePortfolioContextType {
    portfolios: MortgagePortfolio[];
    currentPortfolioId: string;
    addPortfolio: (name: string, color?: string, icon?: string) => string;
    removePortfolio: (id: string) => void;
    updatePortfolio: (id: string, updates: Partial<MortgagePortfolio>) => void;
    setCurrentPortfolioId: (id: string) => void;
}

const MortgagePortfolioContext = createContext<MortgagePortfolioContextType | undefined>(undefined);

export function MortgagePortfolioProvider({ children }: { children: ReactNode }) {
    const [portfolios, setPortfolios] = useLocalStorage<MortgagePortfolio[]>('mortgage_portfolios', []);
    const [currentPortfolioId, setCurrentPortfolioId] = useLocalStorage<string>('current_portfolio_id', '');

    // Initialize default portfolio if none exist
    if (portfolios.length === 0) {
        const defaultPortfolio: MortgagePortfolio = {
            id: 'default',
            name: 'Default Portfolio',
            createdAt: Date.now(),
            color: 'blue-500'
        };
        setPortfolios([defaultPortfolio]);
        if (currentPortfolioId !== 'default') {
            setCurrentPortfolioId('default');
        }
    } else if (!currentPortfolioId || (currentPortfolioId !== 'overview' && !portfolios.find(p => p.id === currentPortfolioId))) {
        // Ensure valid current portfolio, default to overview if available or first portfolio
        setCurrentPortfolioId('overview');
    }

    const addPortfolio = useCallback((name: string, color?: string, icon?: string) => {
        const newPortfolio: MortgagePortfolio = {
            id: `portfolio-${Date.now()}`,
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

        const newPortfolios = portfolios.filter(p => p.id !== id);
        setPortfolios(newPortfolios);

        if (currentPortfolioId === id) {
            setCurrentPortfolioId(newPortfolios[0].id);
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
        <MortgagePortfolioContext.Provider value={value}>
            {children}
        </MortgagePortfolioContext.Provider>
    );
}

export function useMortgagePortfolio() {
    const context = useContext(MortgagePortfolioContext);
    if (context === undefined) {
        throw new Error('useMortgagePortfolio must be used within a MortgagePortfolioProvider');
    }
    return context;
}

export function useCurrentPortfolio() {
    const context = useContext(MortgagePortfolioContext);
    if (context === undefined) {
        throw new Error('useCurrentPortfolio must be used within a MortgagePortfolioProvider');
    }
    const { currentPortfolioId, portfolios } = context;
    return portfolios.find(p => p.id === currentPortfolioId)!;
}