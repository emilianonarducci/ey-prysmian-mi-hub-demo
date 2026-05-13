# infra/terraform/lakebase.tf
# Reference skeleton — NOT apply-ready.
# Phase 0 work: confirm Lakebase availability in target region;
# evaluate against Delta + Databricks Vector Search (see ADR-003).

variable "lakebase_instance_name" {
  description = "Lakebase (serverless Postgres for AI) instance name"
  type        = string
  default     = "prysmian-mi-hub-lakebase" # placeholder
}

variable "lakebase_capacity_units" {
  description = "Capacity (CU) for the Lakebase instance — sized in Phase 0"
  type        = number
  default     = 1 # placeholder
}

# Lakebase provides a pgvector-compatible serverless Postgres
# endpoint. The demo's `pgvector/pgvector:pg16` schemas
# (`silver.news_clean` embedding column with HNSW index) port
# directly here.

# resource "databricks_database_instance" "prysmian_mi_hub" {
#   # TODO Phase 0: tenant-specific configuration
#   name        = var.lakebase_instance_name
#   capacity    = var.lakebase_capacity_units
#   # node_count, storage_gb, pg_version, vpc/subnet bindings TBD
# }

# resource "databricks_database_catalog" "prysmian_mi_hub" {
#   # TODO Phase 0: tenant-specific configuration
#   name              = "prysmian_mi_hub_lakebase"
#   database_instance = databricks_database_instance.prysmian_mi_hub.id
#   # binds Lakebase to Unity Catalog so silver / gold tables are
#   # governable via UC permissions
# }

# Phase 0 decision (ADR-003): if Lakebase is not adopted, this file
# is deleted and replaced by databricks_vector_search_index resources
# over Delta tables in unity_catalog.tf.
