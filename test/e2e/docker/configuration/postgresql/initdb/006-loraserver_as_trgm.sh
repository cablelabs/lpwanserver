#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname="loraserver_as_1" <<-EOSQL
    create extension pg_trgm;
EOSQL
