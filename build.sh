#!/bin/bash

docker run -it -v ${PWD}/src:/workdir/src -v ${PWD}/docker-utils/webpack.config.js:/workdir/webpack.config.js \
 -v ${PWD}/docker-utils/*:/workdir/ \
 -v ${PWD}/dist:/workdir/dist \
 --entrypoint "/bin/bash" js13k-2024