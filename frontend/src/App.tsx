import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import CountryIdPage from "./pages/CountryIdPage";
import ProjectListPage from "./pages/ProjectListPage";
import MarketTrendsPage from "./pages/MarketTrendsPage";
import NewsReportsPage from "./pages/NewsReportsPage";

const qc = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/country/:id" element={<CountryIdPage />} />
            <Route path="/country" element={<Navigate to="/country/italy" replace />} />
            <Route path="/trends" element={<MarketTrendsPage />} />
            <Route path="/news" element={<NewsReportsPage />} />
            <Route path="/projects" element={<ProjectListPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
