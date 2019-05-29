#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    create role loraserver_ns_1 with login password 'loraserver_ns';
    create database loraserver_ns_1 with owner loraserver_ns_1;
EOSQL
