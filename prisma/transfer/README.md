# Transfering from Sqlite3 to Postgres

## Steps

### Copy DB File
Copy your Sqlite database file into this folder.

### Setup docker-compose.yaml
The `docker-compose.yaml` file is setup to start postgres in a container.  It then will build
and run the transfer image, defined in `Dockerfile`.  The transfer container will transfer the
sqlite database file into the postgres container.

In the docker-compose file, change the build arg `DB_FILE` to the filename for your sqlite database.

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

### Modifications
There are a couple of manual modifications required as workarounds to bugs that exist in
Prisma when using it with a pre-existing Postgresql instance.

#### Remove NOT NULL next to all reference fields
Remove "NOT NULL" for all fields that are a reference.  If required, these fields
will be required by Prisma, so there's no chance of them being null, unless inserted
directly into Postgres.
[prisma issue](https://github.com/prisma/prisma/issues/3319)

#### Remove masterProtocol foreign key constraint
The foreign key constraint on master protocol causes Prisma to behave irradically.
Remove/comment-out these lines:
```
ALTER TABLE ONLY public."networkProtocols"
    ADD CONSTRAINT "networkProtocols_masterProtocol_fkey" FOREIGN KEY ("masterProtocol") REFERENCES public."networkProtocols"(id) ON DELETE SET NULL;
```
[prisma issue](https://github.com/prisma/prisma/issues/4204)

#### Remove User role Default 0

Remove "DEFAULT 0" next to the role field in the user table.  There is no role with ID 0.
The code adds a default if not included.

### Customize
This workflow is setup to create a database `prisma` which is owned by user `prisma`.
These values align with how [Prisma](https://prisma.io) will be configured for development.
You can configure Prisma to use any database or user in Postgres, so if you want change those, here is how.
If you're dumping the transfer to a file, the database name doesn't matter, because you
can import it into any database.  If you include the "-O" option in the pg_dump command
the tables won't belong to any user in the backup.  You can choose the table owner and database
name when restoring Postgresql from the backup.

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