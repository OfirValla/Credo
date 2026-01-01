import { BrowserRouter, Route, Routes, useParams, Navigate } from "react-router";
import { ToastContainer } from 'react-toastify';

import { Theme, ThemeProvider } from '@/context/ThemeProvider';
import { PlanProvider } from '@/context/PlanProvider';
import { PortfoliosProvider } from '@/context/PortfoliosContext';

import { Dashboard } from '@/pages/Dashboard';
import { PortfolioPage } from '@/pages/PortfolioPage';

import { Sidebar } from '@/components/Sidebar';

import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <ThemeProvider defaultTheme={Theme.LIGHT} storageKey="vite-ui-theme">
      <PortfoliosProvider>
        <BrowserRouter>
          <Sidebar />
          <div className="ps-16 transition-all duration-300">
            <Routes>
              <Route index element={<Dashboard />} />
              <Route path=":type/:portfolioId" element={<PortfolioPageWrapper />} />
            </Routes>
          </div>
          <ToastContainer position="bottom-right" theme="colored" />
        </BrowserRouter>
      </PortfoliosProvider>
    </ThemeProvider>
  );
}

function PortfolioPageWrapper() {
  const { type, portfolioId } = useParams<{ type: string; portfolioId: string }>();

  if (type !== 'mortgage' && type !== 'loan')
    return <Navigate to="/" replace />;

  return (
    <PlanProvider key={`${type}-${portfolioId}`}>
      <PortfolioPage />
    </PlanProvider>
  );
}

export default App;
