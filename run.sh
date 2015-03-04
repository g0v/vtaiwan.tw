#!/bin/bash

env USE_HTTPS=1 forever server.js &

while true; do
  if $(git pull 2>&1 | grep -q '\->\ origin\/master');then
    npm install && gulp
  fi
  sleep 60
done
