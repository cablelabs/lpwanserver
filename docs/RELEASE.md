# Releasing Versions

### Component.json

The file `component.json` contains the registry and the name of the application.
It contains the version for which release candidates are pushed to Docker Hub,
as well as the build number, overwritten by a Travis environment variable.

### Release candiates

Release candidates are built in Travis and pushed to Docker Hub.  The release candiate
tag name takes the form of VERSION-BUILD_NUMBER-rc.  To release a candidate, first
locate the release candidate in docker hub.

### Edit Component.json

Ensure that the version listed in `component.json` is the version you intend to release.
Update it if necessary.

### Export the release candidate tag

For example:

```
$ export RC_TAG=1.0.0-96-rc
```

### Run the release script

Run `./bin/release.js`.  It will push a docker image tagged with the version.  It will
also create a git tag for that version, with the "v" prefix, and push it up to Github.

### Update Component.json

Increment the version in `component.json` so that release candidates will be built with
the next anticipated version in their tag name.  Commit change.