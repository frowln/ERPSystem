#!/usr/bin/env bash
# =============================================================================
# Install health monitoring cron job for Privod ERP
# Run this ONCE on the production server:
#   sudo bash scripts/setup-monitoring-cron.sh
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CRON_LINE="*/5 * * * * ${SCRIPT_DIR}/health-monitor.sh >> /var/log/privod-health.log 2>&1"

# Check if cron entry already exists
if crontab -l 2>/dev/null | grep -q "health-monitor"; then
    echo "Health monitoring cron already exists. Skipping."
    exit 0
fi

# Add to crontab
(crontab -l 2>/dev/null || true; echo "$CRON_LINE") | crontab -

echo "Health monitoring cron installed (every 5 min)."
echo "Verify with: crontab -l"
echo "Logs: /var/log/privod-health.log"
