# PowerShell script to refresh PATH environment variables
# Run this when npm/git commands aren't found after using Python venv

$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
Write-Host "PATH refreshed! npm and other global tools should now be available." -ForegroundColor Green
