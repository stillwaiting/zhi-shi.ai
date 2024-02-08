#!/bin/bash
set -ex
dir="$(cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
echo $dir
cd $dir
cd ../../app && INLINE_RUNTIME_CHUNK=false yarn build
cd $dir
pwd
rm -rf ./media/*
cp -r ../../app/build/* ./media/
npm version patch
yarn vsce package