#!/bin/bash
set -e

echo "Building..."
node build.js

echo "Pushing to remote..."
git add dist
git commit -m "chore: update dist $(date +%Y-%m-%d\ %H:%M:%S)"
git push
