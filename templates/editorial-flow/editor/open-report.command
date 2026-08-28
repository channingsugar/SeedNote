#!/bin/bash
cd "$(dirname "$0")"
if [ -f "lib/editor/serve.py" ]; then
  exec python3 lib/editor/serve.py
fi
if [ -f "editor/serve.py" ]; then
  exec python3 editor/serve.py
fi
echo "未找到 serve.py"
read -r _
