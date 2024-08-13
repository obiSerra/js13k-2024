#!/bin/bash

docker run -it -v ${PWD}/src:/workdir/src \
 -v ${PWD}/docker-utils/webpack.config.js:/workdir/webpack.config.js \
 -v ${PWD}/docker-utils/create_13k_entry.sh:/workdir/create_13k_entry.sh \
 -v ${PWD}/docker-utils/removeModules.js:/workdir/removeModules.js \
 -v ${PWD}/tsconfig.json:/workdir/tsconfig.json \
 -v ${PWD}/out:/workdir/out \
 -e USER_ID=$(id -u) \
 -e GROUP_ID=$(id -g) \
 --entrypoint "/workdir/create_13k_entry.sh" \
 js13k-2024