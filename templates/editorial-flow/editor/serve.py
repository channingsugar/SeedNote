#!/usr/bin/env python3
"""Serve a report folder and write edits back to index.html."""
from __future__ import annotations

import base64
import json
import os
import socket
import sys
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


def find_report_root() -> str:
    here = os.path.abspath(os.path.dirname(__file__))
    cur = here
    for _ in range(6):
        if os.path.isfile(os.path.join(cur, "index.html")):
            return cur
        parent = os.path.abspath(os.path.join(cur, os.pardir))
        if parent == cur:
            break
        cur = parent
    return os.path.abspath(os.path.join(here, os.pardir, os.pardir))


ROOT = find_report_root()
MEDIA_DIR = os.path.join(ROOT, "lib", "media")


def safe_name(name: str) -> str:
    base = os.path.basename(name or "").replace("..", "")
    return base if base and base not in {".", "/"} else ""


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_GET(self):
        if self.path.rstrip("/") == "/__seed_save":
            self._json({"ok": True, "writeback": True})
            return
        super().do_GET()

    def do_POST(self):
        if self.path.rstrip("/") != "/__seed_save":
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length") or 0)
        try:
            data = json.loads(self.rfile.read(length).decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self.send_error(400)
            return
        html = data.get("html")
        if not isinstance(html, str) or not html.strip():
            self.send_error(400)
            return
        os.makedirs(MEDIA_DIR, exist_ok=True)
        media = data.get("media") or {}
        if isinstance(media, dict):
            for name, b64 in media.items():
                filename = safe_name(str(name))
                if not filename or not isinstance(b64, str):
                    continue
                raw = base64.b64decode(b64)
                with open(os.path.join(MEDIA_DIR, filename), "wb") as fh:
                    fh.write(raw)
        with open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8") as fh:
            fh.write(html)
        self._json({"ok": True})

    def _json(self, payload: dict):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        path = (self.path or "").split("?", 1)[0]
        if "/lib/media/" in path:
            self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, format, *args):
        sys.stderr.write("%s\n" % (format % args))


def free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def main() -> None:
    if not os.path.isfile(os.path.join(ROOT, "index.html")):
        sys.stderr.write("未找到 index.html，请把 serve.py 放在报告的 lib/editor/ 或 editor/ 下。\n")
        sys.exit(1)
    port = free_port()
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    url = f"http://127.0.0.1:{port}/"
    sys.stderr.write(f"报告已打开：{url}\n编辑会写回此文件夹。发给别人时带上整个文件夹。\n")
    webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        sys.stderr.write("\n已停止。\n")


if __name__ == "__main__":
    main()
