#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" prisma  < /docker-entrypoint-initdb.d/all-data