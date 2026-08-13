#!/bin/bash
cd "$(dirname "$0")"
PORT=8756
open_browser() { ( sleep 1; open "http://localhost:$PORT/index.html" ) & }
echo ""
echo "  Starting Ledgerline at http://localhost:$PORT/"
echo "  Keep this window open while you use the app. Close it to stop."
echo ""
# Ruby ships with macOS, so no Python install is needed. PHP/Python used only if present.
if command -v ruby >/dev/null 2>&1; then
  open_browser; exec ruby -run -e httpd . -p $PORT
elif command -v php >/dev/null 2>&1; then
  open_browser; exec php -S localhost:$PORT
elif command -v python3 >/dev/null 2>&1; then
  open_browser; exec python3 -m http.server $PORT
else
  echo "  No built-in web server was found on this Mac."
  echo "  Easiest fix: host it free on GitHub Pages (see the READ ME) — nothing to install."
  echo ""
  read -n 1 -s -r -p "  Press any key to close."
fi
