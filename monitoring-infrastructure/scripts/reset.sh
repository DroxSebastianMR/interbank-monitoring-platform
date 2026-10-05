#!/usr/bin/env sh
set -eu
echo "This removes local Redis, Prometheus and Grafana volumes."
docker compose down --volumes
docker compose up -d --build
