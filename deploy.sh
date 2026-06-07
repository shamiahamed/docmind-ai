#!/bin/bash
set -e

# Go to server build folder
cd /home/ubuntu/docmind-ai/docmind-ai/dist/server

# Ensure server.js points to latest build
ln -sf index.js server.js

# Restart PM2 process
cd /home/ubuntu/docmind-ai/docmind-ai
pm2 restart docmind-ai

# Restart systemd service 
cd /home/ubuntu/docmind-ai/docmind-ai-backend
sudo systemctl restart docmind.service

