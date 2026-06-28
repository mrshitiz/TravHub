@echo off
echo ========================================================
echo Logging into Cloudflare...
echo A browser window should open. If it doesn't, copy the URL below.
echo ========================================================
cloudflared.exe tunnel login
echo.
pause
