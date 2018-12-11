# Command to create dump while postgres container is running
# docker exec $CONTAINER_ID pg_dumpall -U postgres > docker/configuration/postgresql/initdb-demo/demo-dump.out

# Restore
psql -f /docker-entrypoint-initdb.d/demo-dump.out postgres