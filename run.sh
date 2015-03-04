#!/bin/bash

cd "$(dirname "$0")"

env USE_HTTPS=1 forever server.js &

while true; do
  if $(git pull 2>&1 | grep -q '\->\ origin\/master');then
    npm install && forever stopall && gulp
    env USE_HTTPS=1 forever server.js &
  fi
  sleep 60
done
