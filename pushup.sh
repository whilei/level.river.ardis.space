#!/usr/bin/env bash

set -e
set -x

# build:dist doesnt work, so we build dev
npm run build:dist

rsync -avz --delete ./dist/ rottor:/root/riverlevel.ardis.space/
