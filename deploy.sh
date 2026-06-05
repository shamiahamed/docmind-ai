#!/bin/bash

set -e

cd /home/ubuntu/docmind-ai

git pull origin main

cd /home/ubuntu/docmind-ai/docmind-ai

npm run build

cd dist/server
ln -sf index.js server.js

pm2 restart docmind-ai

sudo systemctl restart docmind.service
