# PowerShell script to start both Flask backend and React frontend

Write-Host "Starting Wood Stove Chat Application..." -ForegroundColor Green
Write-Host ""

# Start Flask backend in a new window
Write-Host "Starting Flask API server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; python stove_chat_app.py"

# Wait a moment for Flask to start
Start-Sleep -Seconds 2

# Start React frontend in a new window
Write-Host "Starting React development server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run dev"

Write-Host ""
Write-Host "Both servers are starting in separate windows!" -ForegroundColor Green
Write-Host "Flask API: http://localhost:5000" -ForegroundColor Yellow
Write-Host "React App: http://localhost:5173 (check the React window for actual port)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

