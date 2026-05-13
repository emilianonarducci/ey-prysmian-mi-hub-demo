# Data Sources

Catalogue of public sources referenced by the demo and by the Phase 1
integration backlog. Source of truth: `data/bronze/sources_catalog.yaml`.

## Sources catalogue

| ID | Name | URL | Type | Category | Agent | Integration | ToS status |
|----|------|-----|------|----------|-------|-------------|------------|
| mining_com | mining.com | https://www.mining.com/feed/ | rss | both | news_finder, mining_specialist | demo_active | assumed_compliant_demo_only |
| europacable_news | EuropaCable News | https://www.europacable.eu/feed/ | rss | generic | news_finder | demo_active | assumed_compliant_demo_only |
| iea_news | IEA News | https://www.iea.org/news/feed | rss | generic | news_finder | demo_active | confirm_phase_0 |
| dcd_europe | DCD News Europe | https://www.datacenterdynamics.com/en/news/europe/feed/ | rss | generic | news_finder | demo_active | confirm_phase_0 |
| westmetall_copper | Westmetall LME Copper | https://www.westmetall.com/en/markdaten.php | csv_daily | specialist | mining_specialist | demo_active | verify_redistribution |
| usgs_commodity_summaries | USGS Mineral Commodity Summaries | https://apps.usgs.gov/critical-minerals/mineral-commodities-2026.html | pdf_seed | specialist | mining_specialist | demo_active_seed_only | public_domain_us_gov |
| emj_mining_projects | E&MJ Global Mining Project Spending Outlook | https://www.e-mj.com/features/2025-global-mining-project-spending-outlook/ | pdf_seed | specialist | mining_specialist | demo_active_seed_only | confirm_phase_0 |
| cru_thought_leadership | CRU Thought Leadership | https://www.crugroup.com/en/insights-and-analysis/thought-leadership/ | html_scraping | generic | news_finder | phase_1 | subscription_required |
| pwc_mine_2025 | PwC Mine 2025 | https://www.pwc.com/gx/en/industries/energy-utilities-resources/mining/mine.html | pdf_seed | specialist | mining_specialist | phase_1 | public_report_excerpts_only |
| ey_mining_metals_risks | EY Mining/Metals Risks and Opportunities | https://www.ey.com/en_gl/insights/mining-metals/risks-opportunities | html_scraping | specialist | mining_specialist | phase_1 | ey_internal_use_friendly |
| imf_commodity_prices | IMF Commodity Prices | https://www.imf.org/en/research/commodity-prices | api | specialist | mining_specialist | phase_1 | imf_public_data_terms |
| iea_critical_minerals | IEA Global Critical Minerals Outlook 2025 | https://www.iea.org/reports/global-critical-minerals-outlook-2025/executive-summary | pdf_html | specialist | mining_specialist | phase_1 | iea_publication_terms |

**Demo-active subset**: 7 sources (mining_com, europacable_news, iea_news,
dcd_europe, westmetall_copper, usgs_commodity_summaries,
emj_mining_projects). Of these, USGS and E&MJ are pre-parsed offline
to CSV and committed under `data/bronze/seed/` to avoid PDF parsing at
runtime.

**ToS verification status**: NOT verified for the demo build —
assumed compliant for prototype use only. Phase 0 includes legal
review per source before production ingestion.

## Phase 1 backlog

The client clarification email referenced **30+ approved data
sources** spanning generic industry feeds (cable, energy, utility,
telecom) and specialist mining/critical-minerals publications. The
twelve entries above are the subset that have been catalogued with
structured metadata; the remaining sources from the email are still
to be triaged and added to `sources_catalog.yaml` during Phase 0.

Per-source Phase 0 work for every backlog entry:

1. Confirm Terms of Service and redistribution rights with EY Legal
   and Prysmian MI&D (decision Q18 in `critical-decisions.md`).
2. Decide ingestion pattern (RSS, API, HTML scrape, PDF batch).
3. Confirm rate limits, robots.txt, attribution requirements.
4. Tag for `news_finder`, `mining_specialist`, or a future agent.
5. Add a DLT bronze table once ToS clears.

Sources requiring paid subscriptions (CRU, S&P, WoodMac) are
explicitly out of scope for the Phase 0 free-tier demo and must be
procured through Prysmian's existing licenses.
