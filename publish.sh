rm -rf ../gh-publish/humn-55-final
cp -r ./build/* ../gh-publish/humn-55-final
cd ../gh-publish/humn-55-final
git add .
git commit -m "Publishing"
git push origin gh-pages