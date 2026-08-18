@echo off
cd /d "%~dp0"
echo Starting Benny's Treats local server on http://localhost:8125
echo Press Ctrl+C in this window to stop it.
start "Benny's Treats Server - localhost:8125" cmd /k python -m http.server 8125
timeout /t 2 /nobreak >nul
start "" http://localhost:8125
