##
# You must source this file from the buildspec.yml
# for it to work properly
# Assumes you have a copy of nvm.sh in the root folder
##

echo Installing nvm...
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
export NVM_DIR="$HOME/.nvm"
cd /tmp
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
cd $CODEBUILD_SRC_DIR

export NVM_NODEJS_ORG_MIRROR="https://nodejs.org/dist"
nvm install