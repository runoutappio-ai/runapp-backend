#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/public-frontend"
python3 -m http.server 5175
