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
