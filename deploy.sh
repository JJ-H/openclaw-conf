#!/bin/bash

set -e

echo "🦞 Deploying OpenClaw Gitee Presentation..."
echo ""

echo "📦 Building..."
node build.js

echo ""
echo "🔄 Restarting nginx..."
sudo systemctl restart nginx

echo ""
echo "✅ Deployment complete!"
echo "🚀 Presentation is now live."
