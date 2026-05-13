# infra/terraform/workflows.tf
# Reference skeleton — NOT apply-ready.
# Phase 0 work: confirm Workflows scheduling cadence with Prysmian
# MI&D; confirm Agent Bricks task type availability.

variable "news_finder_schedule_cron" {
  description = "Cron expression for News Finder agent runs"
  type        = string
  default     = "0 0 * * * ?" # hourly — confirm in Phase 0
}

variable "mining_specialist_schedule_cron" {
  description = "Cron expression for Mining Cable Specialist agent runs"
  type        = string
  default     = "0 0 */4 * * ?" # every 4h — confirm in Phase 0
}

# In Phase 1 the demo's apscheduler-driven `agent-worker` container
# is replaced by a Databricks Job per agent. The BaseAgent run()
# method body is rewritten against the Agent Bricks SDK; the
# scheduler hands off the same Pydantic inputs.

# resource "databricks_job" "news_finder" {
#   # TODO Phase 0: tenant-specific configuration
#   name = "prysmian-mi-hub-news-finder"
#
#   schedule {
#     quartz_cron_expression = var.news_finder_schedule_cron
#     timezone_id            = "Europe/Rome"
#     pause_status           = "UNPAUSED"
#   }
#
#   task {
#     task_key = "run_news_finder"
#     # notebook_task / python_wheel_task / spark_python_task TBD
#     # depends on Phase 0 packaging decision (wheel vs notebook).
#   }
#
#   # email_notifications, webhook_notifications, max_concurrent_runs,
#   # retry_policy, timeout_seconds defined in Phase 0.
# }

# resource "databricks_job" "mining_cable_specialist" {
#   # TODO Phase 0: tenant-specific configuration
#   name = "prysmian-mi-hub-mining-specialist"
#   schedule {
#     quartz_cron_expression = var.mining_specialist_schedule_cron
#     timezone_id            = "Europe/Rome"
#     pause_status           = "UNPAUSED"
#   }
#   # task block as above
# }
