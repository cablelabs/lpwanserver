"use strict";

//All HTTP ports used by lpwanserver are defined here

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

const DefaultLpwanPost = 3000;
const DefaultLpwanServerRest = 3200;

exports.lpwanPost = normalizePort(process.env.lpwanPost || DefaultLpwanPost);
exports.lpwanServerRest = normalizePort(process.env.lpwanserver || DefaultLpwanServerRest);
