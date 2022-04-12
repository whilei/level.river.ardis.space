#!/usr/bin/env bash

set -x

# build:dist doesnt work, so we build dev
npm run build:dist

rsync -avz ./dist/ rottor:/root/riverlevel.ardis.space/
