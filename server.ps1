# Ledgerline local server — built into Windows, no Python or installs needed.
$ErrorActionPreference = "Stop"
$port = 8756
$root = $PSScriptRoot
$mime = @{
  ".html"="text/html; charset=utf-8"; ".js"="text/javascript"; ".css"="text/css";
  ".json"="application/json"; ".webmanifest"="application/manifest+json";
  ".png"="image/png"; ".svg"="image/svg+xml"; ".ico"="image/x-icon";
  ".txt"="text/plain; charset=utf-8"; ".woff2"="font/woff2"; ".gif"="image/gif"; ".jpg"="image/jpeg"
}
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
try { $listener.Start() }
catch {
  Write-Host ""
  Write-Host "Could not start the local server on port $port."
  Write-Host "It may already be running, or the port is in use. Close other copies and try again,"
  Write-Host "or host it free on GitHub Pages (see the READ ME)."
  Read-Host "Press Enter to close"
  exit 1
}
Start-Process "http://localhost:$port/index.html"
Write-Host ""
Write-Host "  Ledgerline is running at  http://localhost:$port/"
Write-Host "  Keep this window open while you use the app. Close it to stop the server."
Write-Host ""
while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    $rel = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart("/"))
    if ([string]::IsNullOrWhiteSpace($rel)) { $rel = "index.html" }
    $path = Join-Path $root $rel
    if (Test-Path $path -PathType Container) { $path = Join-Path $path "index.html" }
    if (Test-Path $path -PathType Leaf) {
      $bytes = [System.IO.File]::ReadAllBytes($path)
      $ext = [System.IO.Path]::GetExtension($path).ToLower()
      $ct = $mime[$ext]; if (-not $ct) { $ct = "application/octet-stream" }
      $ctx.Response.ContentType = $ct
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ctx.Response.StatusCode = 404
      $b = [System.Text.Encoding]::UTF8.GetBytes("Not found")
      $ctx.Response.OutputStream.Write($b, 0, $b.Length)
    }
    $ctx.Response.OutputStream.Close()
  } catch { }
}
