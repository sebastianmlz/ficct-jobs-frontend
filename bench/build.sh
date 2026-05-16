#!/bin/sh
# Bench build wrapper.
#
# Why this exists:
#   src/environments/environment.ts currently hard-codes the URL of the
#   *production* build to the dev backend domain. Building the SPA as-is
#   would bake that URL into the bundle and a runtime page-load test would
#   reach the dev domain. To stay fully isolated, this script swaps the
#   apiBaseUrl to "/api/v1" (matching environment.production.ts and the
#   prod nginx proxy intent), builds, then restores the original file.
#
# Isolation invariant: after this script exits (success or failure via
# trap), src/environments/environment.ts is byte-identical to its committed
# version. The user's git status is unchanged.
#
# Usage (from inside the builder container, at /app):
#   sh bench/build.sh
set -eu

ENV_FILE="src/environments/environment.ts"
BACKUP="${ENV_FILE}.bench-backup"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found" >&2
  exit 1
fi

cp "$ENV_FILE" "$BACKUP"
trap 'mv "$BACKUP" "$ENV_FILE" 2>/dev/null || true' EXIT INT TERM

# Force the apiBaseUrl to a relative path so the bundle never points at
# a remote domain. nginx in this bench will proxy /api/v1 to the local
# backend bench.
sed -i "s|apiBaseUrl: *'[^']*'|apiBaseUrl: '/api/v1'|" "$ENV_FILE"
sed -i "s|cvBuilderUrl: *'[^']*'|cvBuilderUrl: 'http://localhost'|" "$ENV_FILE"

echo "Bench environment.ts (transient):"
cat "$ENV_FILE"
echo

# Reuse node_modules from the bench volume if installed.
if [ ! -d node_modules ] || [ ! -d node_modules/@angular ]; then
  echo "Installing deps..."
  npm install --no-audit --no-fund --loglevel=error
fi

echo "Building production bundle..."
npm run build -- --configuration production

echo "Build complete. dist/ contents:"
ls -la dist/ficct-jobs-frontend/browser/ | head -30
