Code structure outline:

Application is started from the project root using the command

    $ node bin/rest

That, in turn, loads the restApp.js in the project root directory.  This
initializes the express app that we will use, as well as setting up the
configuration module (nconf).  It then creates the RestServer object, defined in
the rest directory.

The RestServer creates and stitches together the various parts of the REST
application server.

For each major part of the REST API, it creates the data model objects (starting
with "I" for "Interface"), which in turn load the Data Access Objects (DAOs)
used to support the data models.  The set of DAOs to use are defined in the
configuration data.  This setting corresponds to a directory under
rest/models/dao.  The intent is that multiple data models can be used, from the
production model that is backed by an Sqlite3 database to any number of possible
test models that could define data in, say, memory structures, always starting
at some known state.

Once the data models are created, and their DAOs are connected, the associated
REST APIs are created and initialized.  This initialization sets up the
endpoints and defines the code that uses the models to provide the endpoints'
functionality.

In general terms, then, the restApp sets up the global pieces used throughout
the application.  The RestServer defines the endpoints and the code that
implements their functionality, using the data model interfaces to provide that
functionality.  And finally, the data model interfaces are linked to DAOs that
provide the access to the required data.

Documentation for the REST API is written using apiDoc ( http://apidoc.js ).
When generating new docs, output to the lpwanserver-site repository, under
static/rest/
