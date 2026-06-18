#!/bin/bash
BACKUP_DIR="$(cd "$(dirname "$0")" && pwd)/backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/material_system_react_${TIMESTAMP}.sql"

echo "Backing up material_system_react to $BACKUP_FILE ..."

docker exec material-mysql-react mysqldump -uroot -proot123456 \
  --default-character-set=utf8mb4 \
  --single-transaction \
  --routines \
  --triggers \
  material_system_react > "$BACKUP_FILE" 2>/dev/null

if [ $? -eq 0 ]; then
  gzip "$BACKUP_FILE"
  echo "Backup saved: ${BACKUP_FILE}.gz"
  echo "Size: $(du -h "${BACKUP_FILE}.gz" | cut -f1)"

  TOTAL=$(ls -1 "$BACKUP_DIR"/*.sql.gz 2>/dev/null | wc -l)
  KEEP=10
  if [ "$TOTAL" -gt "$KEEP" ]; then
    DELETE_COUNT=$((TOTAL - KEEP))
    echo "Cleaning old backups (keeping latest $KEEP) ..."
    ls -1t "$BACKUP_DIR"/*.sql.gz | tail -n "$DELETE_COUNT" | xargs rm -f
  fi
else
  rm -f "$BACKUP_FILE"
  echo "ERROR: Backup failed"
  exit 1
fi
