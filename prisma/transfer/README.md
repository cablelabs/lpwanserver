# Transfering from Sqlite3 to Postgres

## Steps

### Copy DB File
Copy your Sqlite database file into this folder.

### Setup docker-compose.yaml
The `docker-compose.yaml` file is setup to start postgres in a container.  It then will build
and run the transfer image, defined in `Dockerfile`.  The transfer container will transfer the
sqlite database file into a database in the postgres container.

Change the build arg `DB_FILE` to the filename for your sqlite database.

### Run docker-compose

```
docker-compose up --build
```

If for whatever reason there is a failure, you'll need to remove the postgres container before retrying.

```
docker container rm lpwan_db_xfer_postgres
docker volume rm transfer_lpwan_db_xfer_postgres
```

Let the Postgres container run.

### Dump postgres DB
Execute a database dump inside of the running container.
[pg_dump docs](https://www.postgresql.org/docs/10/app-pgdump.html)

```
docker exec -ti lpwan_db_xfer_postgres pg_dump -O -U prisma prisma > lpwanserver_postgres.sql
```

Now you have a postgres backup of all the data that was in sqlite.

### Customize
This workflow is setup to create a database `prisma` which is owned by user `prisma`.
These values align with how [Prisma](https://prisma.io) will be configured for development.
You can configure Prisma to use any database and any Postgres user, so if you want change those, here is how.

#### Postgres User (also database name)
Change the value of `POSTGRES_USER` in `docker-compose.yaml`.  When Postgres starts, it creates
a database for that user with the same name.  That database will hold the result of the data/schema
transfer.

#### Other
Additional configuration isn't currently supported; however, hack away.
You could also explore not using this workflow and using [Sequel](http://sequel.jeremyevans.net/) directly.

### Restore database
To restore Postgres from the dump, see [pg_dump docs](https://www.postgresql.org/docs/10/app-pgdump.html)

### Cleanup

```
docker-compose down
docker container rm lpwan_db_xfer_postgres lpwan_db_xfer_transfer
docker volume rm transfer_lpwan_db_xfer_postgres
docker image rm transfer_lpwan_db_xfer
```