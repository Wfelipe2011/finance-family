#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if [ -s "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck source=/dev/null
  . "$HOME/.nvm/nvm.sh"
fi

if ! command -v nvm >/dev/null 2>&1; then
  echo "Error: nvm is not available. Load nvm before running deploy.sh." >&2
  exit 1
fi

nvm use
node -v

docker compose down --remove-orphans
docker compose build --no-cache
docker compose up -d

docker compose ps
