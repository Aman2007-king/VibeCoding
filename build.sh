#!/bin/bash
sudo apt-get install -y g++ gcc default-jdk 2>/dev/null || true
npm install
npm run build
