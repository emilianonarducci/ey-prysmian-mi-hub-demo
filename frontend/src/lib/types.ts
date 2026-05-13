export interface MiningProject {
  id: string;
  name: string;
  owner: string | null;
  country: string | null;
  project_type: string | null;
  capex_estimate_musd: number | null;
  capacity_mw: number | null;
  start_year: number | null;
  end_year: number | null;
  cable_demand_estimate_km: number | null;
  status: string | null;
  source_url: string | null;
  flagged_of_interest: boolean;
  curated_at: string;
  evidence_id: string | null;
  data_source_label: string;
}

export interface ProjectListResponse {
  items: MiningProject[];
  total: number;
  page: number;
  page_size: number;
}

export interface NewsItem {
  id: string;
  source: string;
  url: string;
  title: string;
  summary: string;
  relevance_score: number;
  segments: string[] | null;
  countries: string[] | null;
  published_at: string | null;
  curated_at: string;
  evidence_id: string | null;
  data_source_label: string;
}

export interface TrendPoint {
  period: string;
  value: number | null;
}

export interface IndicatorSeries {
  indicator: string;
  series: TrendPoint[];
  ai_insight_narrative: string | null;
  data_source_label: string;
}

export interface TrendsCountry {
  country: string;
  indicators: IndicatorSeries[];
  copper_history: TrendPoint[];
}

export interface CountrySummary {
  country: string;
  sales_by_customer: { name: string; value: number | null; detail: string }[];
  sales_by_product: { name: string; value: number | null; detail: string }[];
  competitors: { name: string; value: number | null; detail: string }[];
  market_value_by_customer: { name: string; value: number | null; detail: string }[];
}
