#!/bin/bash

rm -rf builds/src
mkdir builds/src
mkdir builds/src/assets
cp -r assets/static builds/src/assets
cp -r scripts view manifest.json builds/src
cd builds
zip -r 0.2.zip src
