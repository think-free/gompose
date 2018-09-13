# build stage

# Compiling web app
FROM node:alpine AS node-env
ADD . /src
RUN cd /src && mv scripts/* ./ && chmod +x *.sh && ./build-react.sh

# Compiling server and integration webapp in binary
FROM golang:alpine AS go-env
ADD . /src
COPY --from=node-env /src/src/gompose/gui/out /src/src/gompose/gui/out
RUN apk update && apk add git
RUN cd /src && mv scripts/* ./ && chmod +x *.sh && ./build-go.sh

# Last stage : Creating final container
FROM alpine
WORKDIR /app
COPY --from=go-env /src/gompose /app/
RUN apk update && apk add docker git curl py-pip
RUN pip install 'docker-compose'
RUN docker-compose version

EXPOSE 8123
ENTRYPOINT ./gompose
