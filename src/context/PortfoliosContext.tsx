import { createContext, useContext, ReactNode, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Portfolio, PortfolioType } from '@/types';

interface PortfoliosContextType {
    portfolios: Portfolio[];
    addPortfolio: (name: string, color?: string, icon?: string, type?: PortfolioType) => string;
    addMultiplePortfolios: (items: Portfolio[]) => string[];
    removePortfolio: (id: string) => void;
    removeAllPortfolios: () => void;
    updatePortfolio: (id: string, updates: Partial<Portfolio>) => void;
}

const PortfoliosContext = createContext<PortfoliosContextType | undefined>(undefined);

export function PortfoliosProvider({ children }: { children: ReactNode }) {
    const [portfolios, setPortfolios] = useLocalStorage<Portfolio[]>('portfolios', []);

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

    const value = {
        portfolios,
        addPortfolio,
        addMultiplePortfolios,
        removePortfolio,
        removeAllPortfolios,
        updatePortfolio,
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
