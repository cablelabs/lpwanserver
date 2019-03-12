#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d prisma -f /docker-entrypoint-initdb.d/baseline