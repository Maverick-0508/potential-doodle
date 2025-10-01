#!/usr/bin/env bash
set -euo pipefail

# Run Node entrypoint to perform seeding and other pre-start tasks
if [ -x "/app/src/entrypoint.js" ]; then
  echo "⚙️  Running backend entrypoint"
  node /app/src/entrypoint.js || echo "Entrypoint finished with non-zero exit (continuing)"
else
  echo "⚠️  No entrypoint script found at /app/src/entrypoint.js"
fi

# Exec the main CMD
exec "$@"
