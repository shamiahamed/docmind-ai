#!/bin/bash

set -e

cd /home/ubuntu/docmind-ai

git pull origin main

cd docmind-ai

export NODE_OPTIONS="--max-old-space-size=3072"

npm install

npm run build

pm2 restart docmind-ai

sudo systemctl restart docmind.service
