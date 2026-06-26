@echo off
title Church Accounting & Audit Management System Setup
echo ==========================================================
echo       Church Accounting System Portable Server Setup
echo ==========================================================

:: 1. 포터블 Node.js PATH 등록
set "SCRIPT_DIR=%~dp0"
set "NODE_PATH=%SCRIPT_DIR%tools\node"
set "PATH=%NODE_PATH%;%PATH%"

echo Checking Node.js Environment...
node -v
if %errorlevel% neq 0 (
    echo [ERROR] Portable Node.js is not found or config failed.
    pause
    exit /b 1
)

:: 2. 프론트엔드 빌드 수행
echo.
echo ==========================================================
echo               Building Frontend Assets (PWA)
echo ==========================================================
cd /d "%SCRIPT_DIR%frontend"
call npm run build

if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed.
    pause
    exit /b 1
)
echo Frontend Build Completed successfully.

:: 3. 백엔드 서버 구동
echo.
echo ==========================================================
echo               Starting Express & PostgreSQL Backend
echo ==========================================================
cd /d "%SCRIPT_DIR%backend"
echo Server starting at http://localhost:5000
echo You can open this URL on your mobile browser or PC.
node server.js

pause
