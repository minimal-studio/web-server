mkdir -p ./zip-build;
rm ./zip-build/build.zip;
zip -r ./zip-build/build.zip ./* -x '/node_modules/*' -x '/assets/public/*' -x '/runtime/*' -x '/assets/zips/*' -x '/yarn.lock' -x '/package-lock.json' -x '/zip.sh'