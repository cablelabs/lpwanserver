---
id: build
title: Build
sidebar_label: Build
---

## LPWAN Server

If you've customized the LPWAN Server, you can build a custom docker image.
This shouldn't be necessary unless you've actually added or modified code.
It would also be necessary if you want LPWAN Server to serve a custom UI.

Run docker build:

```
$ docker build -f docker/Dockerfile -t <my-registry>/<my-lpwanserver>:<version> .
```

## Web Client

If you want to use the default web-client, but you want to customize or configure it,
you will need to build the static assets.

```
# From within the lpwanserver-web-client repo
npm run build
```

If you plan to serve the customized/configured web-client from LPWAN Server,
you'll need to copy the built files into the lpwanserver repo and then use the command above
to build a new docker image. The Dockerfile is setup to copy the `public` folder into the image,
so it's easiest to use the `public` folder.  Also make sure the LPWAN Server's `public_dir`
config variable is set to `public`.

```
mv build/* ../lpwanserver/public
# run docker build command above
```

If you plan to serve the static assets from elsewhere, you'll need to set the location
of the LPWAN Server before building the web-client assets.  Use `REACT_APP_REST_SERVER_URL`
in the `.env` file.
