#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    create role prisma with login password 'prisma';
    create database prisma owner prisma;
EOSQL

# psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d prisma -f /baseline-data/baseline.sql
