rm -Rf ./zip-build
mkdir -p ./zip-build;
zip -r ./zip-build/build.zip ./* -x '/node_modules/*' -x '/assets/public/*' -x '/runtime/f-e-deployment-store/*' -x '/runtime/web-server.log' -x '/assets/zips/*' -x '/yarn.lock' -x '/package-lock.json' -x '/zip.sh' -x '/zip-build/*' -x '**/.git/*'