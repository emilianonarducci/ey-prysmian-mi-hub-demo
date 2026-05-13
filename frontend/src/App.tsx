import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import CountryIdPage from "./pages/CountryIdPage";
import ProjectListPage from "./pages/ProjectListPage";
import MarketTrendsPage from "./pages/MarketTrendsPage";
import NewsReportsPage from "./pages/NewsReportsPage";
import LoginPage from "./pages/LoginPage";
import ComparePage from "./pages/ComparePage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ReviewQueuePage from "./pages/ReviewQueuePage";
import AgentsPage from "./pages/AgentsPage";
import AlertsPage from "./pages/AlertsPage";

const qc = new QueryClient();

function RequireAuth({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const user = sessionStorage.getItem("mi_hub_user");
  if (!user) {
    return <Navigate to="/login" state={{ from: loc }} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route path="/" element={<LandingPage />} />
            <Route path="/country/:id" element={<CountryIdPage />} />
            <Route path="/country" element={<Navigate to="/country/italy" replace />} />
            <Route path="/trends" element={<MarketTrendsPage />} />
            <Route path="/news" element={<NewsReportsPage />} />
            <Route path="/projects" element={<ProjectListPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/review" element={<ReviewQueuePage />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
