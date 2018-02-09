"use strict";

//All HTTP ports used by lpwan are defined here

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
const DefaultLpwanServer = 3400;

exports.lpwanPost = normalizePort(process.env.lpwanPost || DefaultLpwanPost);
exports.lpwanServerExpress = normalizePort(process.env.lpwanServer || DefaultLpwanServer);
