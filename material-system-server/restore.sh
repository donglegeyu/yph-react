#!/bin/bash
set -e

BACKUP_DIR="$(cd "$(dirname "$0")" && pwd)/backups"

if [ -z "$1" ]; then
  echo "Usage: ./restore.sh <backup_file.sql.gz|latest>"
  echo ""
  echo "Available backups:"
  ls -1t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | head -10 || echo "  No backups found"
  exit 1
fi

if [ "$1" = "latest" ]; then
  BACKUP_FILE=$(ls -1t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | head -1)
  if [ -z "$BACKUP_FILE" ]; then
    echo "ERROR: No backups found"
    exit 1
  fi
else
  BACKUP_FILE="$1"
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: File not found: $BACKUP_FILE"
  exit 1
fi

echo "WARNING: This will REPLACE all data in material_system_react!"
echo "Backup file: $BACKUP_FILE"
echo "Size: $(du -h "$BACKUP_FILE" | cut -f1)"
echo ""
read -p "Continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Cancelled"
  exit 0
fi

echo "Restoring ..."
gunzip -c "$BACKUP_FILE" | docker exec -i material-mysql-react mysql -uroot -proot123456 \
  --default-character-set=utf8mb4 material_system_react 2>/dev/null

if [ $? -eq 0 ]; then
  echo "Restore completed successfully"
  echo "Restarting backend ..."
  cd "$(dirname "$0")"
  docker compose restart backend 2>/dev/null
else
  echo "ERROR: Restore failed"
  exit 1
fi
