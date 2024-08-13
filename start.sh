#!/bin/bash

docker run -it -p 4000:4000 -v ${PWD}/src:/workdir/src \
 -v ${PWD}/docker-utils/webpack.config.js:/workdir/webpack.config.js \
 -v ${PWD}/tsconfig.json:/workdir/tsconfig.json \
 js13k-2024