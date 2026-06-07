#!/bin/bash

set -e

cd /home/ubuntu/docmind-ai

git pull origin main

cd /home/ubuntu/docmind-ai/docmind-ai/dist/server
ln -sf index.js server.js

cd /home/ubuntu/docmind-ai/docmind-ai

pm2 restart docmind-ai

cd /home/ubuntu/docmind-ai/docmind-ai-backend
sudo systemctl restart docmind.service
