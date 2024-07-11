set -xeu
REACT_APP_LANG=ru yarn build
cp -r build/* ../../zhi-shi.ai-deploy-ru
cd ../../zhi-shi.ai-deploy-ru
git add .
git commit -m "update"
git push
