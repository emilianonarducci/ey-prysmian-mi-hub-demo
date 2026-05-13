# infra/terraform/unity_catalog.tf
# Reference skeleton — NOT apply-ready.
# Phase 0 work: validate against tenant metastore + privilege model.

variable "uc_metastore_id" {
  description = "Unity Catalog metastore ID for the EY/Prysmian region"
  type        = string
  default     = "" # placeholder
}

# Reference layout — the demo Postgres schemas
# (bronze / silver / gold / audit) map 1:1 to Unity Catalog schemas
# under a single catalog named `prysmian_mi_hub`.

# resource "databricks_catalog" "prysmian_mi_hub" {
#   # TODO Phase 0: tenant-specific configuration
#   name         = "prysmian_mi_hub"
#   metastore_id = var.uc_metastore_id
#   comment      = "Prysmian Marketing Intelligence Hub — managed by EY"
#   properties = {
#     owner = "ey_italy_data_ai"
#   }
# }

# resource "databricks_schema" "bronze" {
#   # TODO Phase 0: tenant-specific configuration
#   catalog_name = databricks_catalog.prysmian_mi_hub.name
#   name         = "bronze"
#   comment      = "Raw, append-only ingestion (DLT bronze tables)"
# }

# resource "databricks_schema" "silver" {
#   # TODO Phase 0: tenant-specific configuration
#   catalog_name = databricks_catalog.prysmian_mi_hub.name
#   name         = "silver"
#   comment      = "Validated, normalized, entity-resolved"
# }

# resource "databricks_schema" "gold" {
#   # TODO Phase 0: tenant-specific configuration
#   catalog_name = databricks_catalog.prysmian_mi_hub.name
#   name         = "gold"
#   comment      = "Agent-produced, UI-facing"
# }

# resource "databricks_schema" "audit" {
#   # TODO Phase 0: tenant-specific configuration
#   catalog_name = databricks_catalog.prysmian_mi_hub.name
#   name         = "audit"
#   comment      = "Agent run + evidence metadata (EU AI Act Article 12 traceability)"
# }

# Grants would also be defined here once group / service-principal
# identities are agreed in Phase 0 with EY Cyber + Prysmian InfoSec.
