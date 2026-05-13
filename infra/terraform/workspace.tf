# infra/terraform/workspace.tf
# Reference skeleton — NOT apply-ready.
# Phase 0 work: validate against tenant + region + workspace ID + auth.

terraform {
  required_providers {
    databricks = {
      source  = "databricks/databricks"
      version = "~> 1.50" # TODO Phase 0: confirm at kickoff
    }
  }
  # TODO Phase 0: add a remote backend (S3 / Azure Blob) with state locking.
  # backend "s3" {}
}

provider "databricks" {
  # TODO Phase 0: configure host + auth via service principal.
  host = var.databricks_workspace_url
  # auth_type = "azure-cli" | "oauth" | "pat" — pick per tenant
}

variable "databricks_workspace_url" {
  description = "Databricks workspace URL (set during Phase 0 from tenant)"
  type        = string
  default     = "" # placeholder
}

variable "databricks_account_id" {
  description = "Databricks account ID (set during Phase 0)"
  type        = string
  default     = "" # placeholder
}

variable "environment" {
  description = "Environment tag: dev | staging | prod"
  type        = string
  default     = "dev"
}

# Reference: workspace settings, catalog assignment, network config,
# private link, customer-managed keys would go here in production.
#
# Example (commented — not apply-ready):
#
# resource "databricks_mws_workspaces" "prysmian_mi_hub" {
#   # TODO Phase 0: tenant-specific configuration
#   account_id     = var.databricks_account_id
#   workspace_name = "prysmian-mi-hub-${var.environment}"
#   aws_region     = "eu-west-1" # confirm with Prysmian data residency
#   # credentials_id, storage_configuration_id, network_id, etc.
# }
