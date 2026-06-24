#!/bin/bash
set -e  # fail fast on any error

echo "=== Installing system deps ==="
apt-get install -y g++ gcc make python3 default-jdk 2>/dev/null || true

echo "=== Installing npm packages ==="
npm install

echo "=== Rebuilding native modules for current Node version ==="
# better-sqlite3 is a native .node binary compiled for a specific
# NODE_MODULE_VERSION. When Render upgrades its Node.js runtime between
# deploys, the precompiled binary no longer matches and the server crashes
# on startup with "was compiled against a different Node.js version".
# npm rebuild compiles it fresh against the Node binary that will actually
# run the app, making this version-agnostic.
npm rebuild better-sqlite3

echo "=== Building frontend ==="
npm run build

echo "=== Build complete ==="
node --version
