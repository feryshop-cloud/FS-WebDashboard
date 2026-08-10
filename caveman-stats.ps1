# caveman-stats.ps1
# Shortcut: jalankan caveman-stats pada session Antigravity CLI terbaru.
# Usage: .\caveman-stats.ps1 [--all] [--share]

$brainDir = "C:\Users\andii\.gemini\antigravity-cli\brain"
$statsJs  = "C:\Users\andii\.gemini\config\skills\caveman\src\hooks\caveman-stats.js"

# Cari transcript.jsonl paling baru dari semua session
$latest = Get-ChildItem -Path $brainDir -Recurse -Filter "transcript.jsonl" -ErrorAction SilentlyContinue |
          Sort-Object LastWriteTime -Descending |
          Select-Object -First 1

if (-not $latest) {
    Write-Host "caveman-stats: tidak ada transcript session ditemukan di $brainDir" -ForegroundColor Red
    exit 1
}

# Forward extra args (--all, --share, --since, dll.)
$extraArgs = $args

node $statsJs --session-file $latest.FullName @extraArgs
