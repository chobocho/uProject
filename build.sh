#!/usr/bin/env bash
# Build a single self-contained release/index.html
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "[1/3] cleaning…"
rm -rf build
mkdir -p build release

echo "[2/3] compiling TypeScript…"
if command -v tsc >/dev/null 2>&1; then
  tsc -p tsconfig.json
elif command -v npx >/dev/null 2>&1; then
  npx -y -p typescript tsc -p tsconfig.json
else
  echo "Error: neither 'tsc' nor 'npx' was found in PATH." >&2
  exit 1
fi

echo "[3/3] inlining JS into HTML…"
node -e '
  const fs = require("fs");
  const path = require("path");
  const html = fs.readFileSync("template.html", "utf8");
  const js   = fs.readFileSync(path.join("build", "app.js"), "utf8");
  // Use a function replacer so $ and $& in JS are not interpreted as backrefs.
  const out = html.replace("__APP_JS__", () => js);
  fs.writeFileSync(path.join("release", "index.html"), out);
  const sz = fs.statSync(path.join("release", "index.html")).size;
  console.log("✓ release/index.html  (" + sz.toLocaleString() + " bytes)");
'
