# Databricks Infrastructure — Reference Skeletons

**THESE FILES ARE NOT APPLY-READY.**

They are conceptual references demonstrating the target Databricks
infrastructure for the Phase 1 production deployment. They have NOT
been:

- validated against a real Prysmian/EY Databricks tenant
- tested with `terraform plan` or `terraform apply`
- reviewed for security, IAM, or network topology
- configured with real provider versions, regions, or workspace IDs

**Do NOT run `terraform apply` on these files.** Use them as starting
reference during Phase 0 tenant-specific configuration.

## Files

- `workspace.tf` — Databricks workspace provisioning skeleton
- `unity_catalog.tf` — Catalog + schemas for MI Hub domain
- `lakebase.tf` — Serverless Postgres for AI (pgvector-compatible) skeleton
- `model_serving.tf` — Foundation Model APIs endpoint skeleton
- `workflows.tf` — Databricks Workflows for agent scheduling skeleton

## Phase 0 work required before apply

1. Confirm Prysmian Databricks tenant URL, account ID, region.
2. Configure provider authentication via EY service principal.
3. Validate provider versions against current Databricks releases.
4. Add tenant-specific networking (VPC, subnet IDs, private endpoints).
5. Add state backend (S3 / Azure Blob with locking).
6. Security + IAM review with EY Cyber and Prysmian InfoSec.
