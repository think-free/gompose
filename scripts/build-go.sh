#!/bin/sh

export GOPATH=`pwd`
export GOBIN=`pwd`
go get -u github.com/GeertJohan/go.rice
go get -u github.com/GeertJohan/go.rice/rice
go get -u github.com/golang/dep/cmd/dep

cd src/gompose
../../dep ensure
../../rice embed-go
go build
mv gompose ../../
cd ../..
