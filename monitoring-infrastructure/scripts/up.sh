#!/usr/bin/env sh
set -eu
docker compose up -d --build
docker compose ps
