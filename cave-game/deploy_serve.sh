#!/bin/bash

# called by .github/workflows/fuckelonmusk.yml

npm install
npm run build
sudo systemctl restart cavegame
