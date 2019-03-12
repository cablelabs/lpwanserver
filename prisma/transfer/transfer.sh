#!/bin/bash
set -e

# wait for postgres to start
sleep 5s

# transfer data into postgres
sequel -C sqlite://${DB_FILE} postgres://${POSTGRES_HOST}/${POSTGRES_USER}
