#!/bin/bash

echo "Starting deployment..."

cd /home/ubuntu/docmind-ai

git pull origin main

echo "Restarting frontend..."
pm2 restart docmind-ai

echo "Restarting backend..."
sudo systemctl restart docmind.service

echo "Deployment completed successfully"
