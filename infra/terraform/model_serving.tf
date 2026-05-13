# infra/terraform/model_serving.tf
# Reference skeleton — NOT apply-ready.
# Phase 0 work: confirm Foundation Model APIs availability in region;
# confirm Claude Sonnet + Haiku model names exposed by FM APIs at
# implementation time (ADR-005).

variable "fm_api_endpoint_name" {
  description = "Mosaic AI Model Serving endpoint name for Claude"
  type        = string
  default     = "prysmian-mi-hub-claude" # placeholder
}

variable "fm_api_primary_model" {
  description = "Primary served model (e.g., databricks-claude-sonnet)"
  type        = string
  default     = "" # TODO Phase 0: confirm exact served-model name
}

variable "fm_api_fallback_model" {
  description = "Fallback served model (e.g., databricks-claude-haiku)"
  type        = string
  default     = "" # TODO Phase 0: confirm exact served-model name
}

# In Phase 1 the agents call this endpoint instead of the Anthropic
# hosted API. The wrapper `agents/llm/client.py` from the demo is
# the single swap-point (ADR-005).

# resource "databricks_model_serving" "claude_endpoint" {
#   # TODO Phase 0: tenant-specific configuration
#   name = var.fm_api_endpoint_name
#
#   config {
#     served_entities {
#       name        = "primary"
#       entity_name = var.fm_api_primary_model
#       # entity_version, workload_size, scale_to_zero TBD
#     }
#     served_entities {
#       name        = "fallback"
#       entity_name = var.fm_api_fallback_model
#     }
#
#     traffic_config {
#       routes {
#         served_model_name  = "primary"
#         traffic_percentage = 100
#       }
#     }
#   }
#
#   # rate_limits, ai_gateway (PII / guardrails / audit logging),
#   # tags, permissions defined in Phase 0.
# }
