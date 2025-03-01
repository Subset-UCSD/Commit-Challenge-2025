#!/bin/bash

# called by .github/workflows/fuckelonmusk.yml

npm install
npm run build
systemctl restart cavegame