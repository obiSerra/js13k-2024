FROM node

RUN mkdir /workdir
WORKDIR /workdir

COPY package.json /workdir
COPY src /workdir/src

COPY ./docker-utils/ /workdir/

RUN npm install

ENTRYPOINT ["npm"]

CMD ["run", "serve"]