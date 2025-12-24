import { BrowserRouter, Route, Routes } from "react-router";

import { ThemeProvider } from '@/context/ThemeProvider';
import { PlanProvider } from '@/context/PlanProvider';
import { PortfolioProvider } from '@/context/PortfolioContext';

import { Sidebar } from '@/components/Sidebar';

import { Dashboard } from '@/pages/Dashboard';
import { PortfolioPage } from '@/pages/PortfolioPage';
import { useParams, Navigate } from 'react-router';


function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <PortfolioProvider>
        <BrowserRouter>
          <Sidebar />
          <div className="pl-16 transition-all duration-300">
            <Routes>
              <Route index element={<Dashboard />} />
              <Route path=":type/:portfolioId" element={<PortfolioPageWrapper />} />
            </Routes>
          </div>
        </BrowserRouter>
      </PortfolioProvider>
    </ThemeProvider>
  );
}

function PortfolioPageWrapper() {
  const { type, portfolioId } = useParams<{ type: string; portfolioId: string }>();

  if (type !== 'mortgage' && type !== 'loan') {
    return <Navigate to="/" replace />;
  }

  return (
    <PlanProvider key={`${type}-${portfolioId}`} storagePrefix={type}>
      <PortfolioPage />
    </PlanProvider>
  );
}

export default App;
