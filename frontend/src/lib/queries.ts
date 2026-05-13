import { useQuery } from "@tanstack/react-query";
import api from "./api";
import type { ProjectListResponse, NewsItem, TrendsCountry, CountrySummary } from "./types";

export function useProjects(filters: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: ["projects", filters],
    queryFn: async () => {
      const { data } = await api.get<ProjectListResponse>("/projects", { params: filters });
      return data;
    }
  });
}

export function useNews(q?: string) {
  return useQuery({
    queryKey: ["news", q],
    queryFn: async () => {
      const { data } = await api.get<NewsItem[]>("/news", { params: { q } });
      return data;
    }
  });
}

export function useTrends(country: string) {
  return useQuery({
    queryKey: ["trends", country],
    queryFn: async () => {
      const { data } = await api.get<TrendsCountry>(`/trends/${country}`);
      return data;
    },
    enabled: !!country,
  });
}

export interface GlobalSearchResult {
  query: string;
  news: { id: string; title: string; source: string; url: string; published_at: string | null; countries: string[] | null }[];
  projects: { id: string; name: string; owner: string | null; country: string | null; status: string | null; flagged_of_interest: boolean }[];
  countries: { id: string; name: string }[];
  totals: { news: number; projects: number; countries: number };
}

export function useGlobalSearch(q: string) {
  return useQuery({
    queryKey: ["search", q],
    queryFn: async () => {
      const { data } = await api.get<GlobalSearchResult>("/search", { params: { q } });
      return data;
    },
    enabled: q.trim().length >= 2,
    staleTime: 30_000,
  });
}

export function useCountrySummary(countryId: string) {
  return useQuery({
    queryKey: ["country", countryId],
    queryFn: async () => {
      const { data } = await api.get<CountrySummary>(`/countries/${countryId}/summary`);
      return data;
    },
    enabled: !!countryId,
  });
}
