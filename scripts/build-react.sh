#!/bin/sh

cd src/gompose/gui
npm install
npm run build
npm run export
cd ../../..
