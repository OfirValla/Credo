import { BrowserRouter, Route, Routes, useParams, Navigate } from "react-router";
import { ToastContainer } from 'react-toastify';

import { Theme, ThemeProvider } from '@/context/ThemeProvider';
import { PlanProvider } from '@/context/PlanProvider';
import { PortfoliosProvider } from '@/context/PortfoliosContext';

import { Dashboard } from '@/pages/Dashboard';
import { Portfolio } from '@/pages/Portfolio';
import { CreatePortfolio } from '@/pages/CreatePortfolio';

import { Sidebar } from '@/components/Sidebar';

import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <ThemeProvider defaultTheme={Theme.LIGHT} storageKey="vite-ui-theme">
      <BrowserRouter>
        <PortfoliosProvider>
          <Sidebar />
          <div className="ps-16 transition-all duration-300">
            <Routes>
              <Route index element={<Dashboard />} />
              <Route path="portfolio/create" element={<CreatePortfolio />} />
              <Route path=":type/:portfolioId" element={<PortfolioPageWrapper />} />
            </Routes>
          </div>
          <ToastContainer position="bottom-right" theme="colored" />
        </PortfoliosProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}


function PortfolioPageWrapper() {
  const { type, portfolioId } = useParams<{ type: string; portfolioId: string }>();

  if (type !== 'mortgage' && type !== 'loan')
    return <Navigate to="/" replace />;

  return (
    <PlanProvider key={`${type}-${portfolioId}`}>
      <Portfolio />
    </PlanProvider>
  );
}

export default App;
