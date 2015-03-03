#!/bin/sh
perl -e while (sleep 60) { system("npm install && gulp") if `git pull 2>&1` =~ /-> origin.master/ } &
