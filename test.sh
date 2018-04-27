#!/bin/bash
#
# Runs the test suite on the server.
#
# Copy over a starting database so we start from a known state.
export NODE_ENV=ci

cp data/test.sqlite3.testSuiteStartingDB /tmp/test.sqlite3

# Start a process to receive POSTS from lora-app-server
python2 test/receivePostOnPort.py 5086 &
PID=$!

# TODO: Verify/set config to use the test database

# Run the suite
mocha

kill $PID
rm -f receivedPostData.txt
