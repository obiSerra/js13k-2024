FROM node

RUN mkdir /workdir
WORKDIR /workdir

COPY package.json /workdir
COPY src /workdir/src

COPY ./docker-utils/ /workdir/
COPY tsconfig.json /workdir/tsconfig.json

RUN npm install

RUN apt update && apt install -y zip unzip

ENTRYPOINT ["npm"]

CMD ["run", "serve"]