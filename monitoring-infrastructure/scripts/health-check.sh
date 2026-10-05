#!/usr/bin/env sh
set -eu
for url in http://localhost:8080/health http://localhost:4000/health http://localhost:8000/health http://localhost:5173/dashboard-health http://localhost:9090/-/healthy; do
  printf '%s: ' "$url"
  curl --fail --silent --show-error "$url" >/dev/null && echo OK
done
