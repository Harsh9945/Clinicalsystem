@echo off
title Clinova AI Triage Engine
cd /d "%~dp0"

echo ========================================================
echo        Clinova AI Triage Engine Startup Script
echo ========================================================

:: Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found in 'venv' directory.
    echo Please set up your virtual environment as described in the README.
    pause
    exit /b 1
)

echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

:: Make sure watchfiles is installed for fast event-driven reloading on Windows
python -c "import watchfiles" 2>nul
if %errorlevel% neq 0 (
    echo [INFO] 'watchfiles' not detected in environment. Installing...
    pip install watchfiles
)

:run
echo [INFO] Starting FastAPI application on port 8000...
echo [INFO] Reload exclusions: venv
echo [INFO] Press Ctrl+C in this window to stop the service.
echo --------------------------------------------------------

uvicorn main:app --host 127.0.0.1 --port 8000 --reload --reload-exclude "venv"

echo --------------------------------------------------------
echo [WARNING] AI Triage microservice stopped or crashed.
echo [INFO] Auto-restarting in 3 seconds...
timeout /t 3
goto run
