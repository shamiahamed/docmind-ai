#!/bin/bash
set -e

cd /home/ubuntu/docmind-ai

git pull origin main

cd /home/ubuntu/docmind-ai/docmind-ai

export NODE_OPTIONS="--max-old-space-size=4096"

npm run build

cd dist/server
ln -sf index.js server.js

cd /home/ubuntu/docmind-ai/docmind-ai

pm2 restart ecosystem.config.cjs --env production --update-env

cd /home/ubuntu/docmind-ai/docmind-ai-backend
sudo systemctl restart docmind.service
