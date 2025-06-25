#!/bin/bash

# called by .github/workflows/fuckelonmusk.yml

git diff HEAD # wtf who left uncommited changes
git reset --hard HEAD # this will still break if someone decides to commit on the server
git pull

npm install
npm run build
# its like this for a reason, if you change the command format,
# the visudo rule will fail and it will prompt you for a password
# to restart cavegame
sudo /bin/systemctl restart cavegame.service
