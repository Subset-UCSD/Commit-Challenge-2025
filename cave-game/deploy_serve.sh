#!/bin/bash

# called by .github/workflows/fuckelonmusk.yml

npm install
npm run build

if [ -f ../cavegame_pid.txt ]; then
  PID=$(cat ../cavegame_pid.txt)
  echo try asking it to die
  if ! kill $PID 2>/dev/null; then
    echo it did not kill successfully for some reason, give it a second
    sleep 1
    echo then really kill it
    kill -9 $PID || true
  fi
fi

echo "[restarted]" >> ../cavegame.log
date >> ../cavegame.log

# start the server and set it free
CAVE_GAME_PORT=80 nohup node dist/index.js >> ../cavegame.log 2>&1 &
echo $! > ../cavegame_pid.txt
echo PID=$(cat ../cavegame_pid.txt) >> ../cavegame.log
