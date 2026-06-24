# Deploy moji-studios.com to Cloudflare Pages, then ping IndexNow so
# Bing/Naver/Seznam/Yandex (and downstream AI search) re-crawl immediately.
# Usage: .\deploy.ps1

$ErrorActionPreference = "Stop"

npx wrangler pages deploy . --project-name=moji-studios --branch=main

$key = "04fbe46d731747a20579b2c522f5e073"
$urls = @(
  "https://moji-studios.com/",
  "https://moji-studios.com/games/",
  "https://moji-studios.com/services/",
  "https://moji-studios.com/games/mojiworld/",
  "https://moji-studios.com/games/bitmon/",
  "https://moji-studios.com/games/chubby-bird/",
  "https://moji-studios.com/games/mojiworld-vs-bitmon/",
  "https://moji-studios.com/chubbybird/",
  "https://moji-studios.com/press/",
  "https://moji-studios.com/llms.txt"
)

$body = @{
  host        = "moji-studios.com"
  key         = $key
  keyLocation = "https://moji-studios.com/$key.txt"
  urlList     = $urls
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "https://api.indexnow.org/indexnow" `
  -ContentType "application/json; charset=utf-8" -Body $body
Write-Host "IndexNow pinged for $($urls.Count) URLs."
