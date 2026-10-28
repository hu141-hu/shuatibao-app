@echo off
cd /d "%~dp0"
echo ============================================
echo   ShuaTiBao Web - dev server
echo   http://localhost:3000
echo   Press Ctrl+C to stop
echo ============================================
echo.
call npm run dev
pause
