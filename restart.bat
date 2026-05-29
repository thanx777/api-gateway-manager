@echo off
title Gateway Restart
echo ===================================================
echo Killing old processes...
echo ===================================================
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo.
echo ===================================================
echo Starting gateway...
echo ===================================================
start "Gateway-Backend" cmd /k "title Gateway-Backend-3001 && node server.js"
start "Gateway-Frontend" cmd /k "title Gateway-Frontend-3000 && npm run dev"
echo.
echo Backend : http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo To start CC:
echo   set ANTHROPIC_BASE_URL=http://127.0.0.1:3001
echo   set ANTHROPIC_API_KEY=dummy
echo   claude
echo ===================================================
pause
