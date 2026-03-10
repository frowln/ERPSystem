#!/usr/bin/env bash
# =============================================================================
# Install daily backup cron job for Privod ERP
# Run this ONCE on the production server:
#   sudo bash scripts/setup-backup-cron.sh
# =============================================================================
set -euo pipefail

CRON_LINE="0 3 * * * cd /opt/privod2 && docker compose -f docker-compose.server.yml --profile backup run --rm db-backup >> /var/log/privod-backup.log 2>&1"

# Check if cron entry already exists
if crontab -l 2>/dev/null | grep -q "privod2.*backup"; then
  echo "Backup cron already exists. Skipping."
  exit 0
fi

# Add to crontab
(crontab -l 2>/dev/null || true; echo "${CRON_LINE}") | crontab -

echo "Backup cron installed. Backups will run daily at 03:00."
echo "Verify with: crontab -l"
echo "Logs: /var/log/privod-backup.log"
echo "Backups: docker volume inspect privod2_backups"
