import { BrowserRouter, Route, Routes } from "react-router";

import { ThemeProvider } from '@/context/ThemeProvider';
import { MortgageProvider } from '@/context/MortgageProvider';
import { PortfolioProvider, usePortfolios } from '@/context/PortfolioContext';

import { Sidebar } from '@/components/Sidebar';

import { Dashboard } from '@/pages/Dashboard';
import { Mortgage } from '@/pages/mortgage';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <PortfolioProvider>
        <BrowserRouter>
          <Sidebar />
          <div className="pl-16 transition-all duration-300">
            <Routes>
              <Route index element={<Dashboard />} />
              <Route path="mortgage/:portfolioId" element={
                <MortgageProvider>
                  <Mortgage />
                </MortgageProvider>
              } />
            </Routes>
          </div>
        </BrowserRouter>
      </PortfolioProvider>
    </ThemeProvider>
  );
}

export default App;
