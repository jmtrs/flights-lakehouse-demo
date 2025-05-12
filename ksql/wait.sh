#!/usr/bin/env bash
set -euo pipefail

URL=${KSQL_SERVER:-http://ksqldb-server:8088}

echo "⏳ Waiting for $URL ..."
until curl -sf "$URL/info" >/dev/null; do
  sleep 2
done
echo "✅ ksqlDB is up; executing init.sql"

# Ejecuta el fichero por STDIN; si algo falla, aborta (set -e)
cat /init.sql | ksql "$URL"

echo "✔︎ init.sql executed — bye!"
