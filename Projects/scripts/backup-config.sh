#!/bin/bash
BACKUP_DIR="$HOME/clawd/backups"
DATE=$(date +%Y%m%d)
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/config-$DATE.tar.gz" ~/.clawdbot/
echo "Backup saved to: $BACKUP_DIR/config-$DATE.tar.gz"
