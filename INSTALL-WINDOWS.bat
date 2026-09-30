@echo off
setlocal
cd /d "%~dp0"
title Desktop Pet - Development Run

echo ========================================
echo Desktop Pet v0.1.12 Development Run
 echo ========================================
echo.
echo This script runs the app from source. It does NOT build the portable EXE.
echo For the EXE build, use BUILD-WINDOWS.bat.
echo.

echo [1/3] Installing dependencies...
CALL npm.cmd install
if errorlevel 1 goto :error

echo.
echo [2/3] Running automated checks...
CALL npm.cmd test
if errorlevel 1 goto :error
CALL npm.cmd run check
if errorlevel 1 goto :error

echo.
echo [3/3] Starting Desktop Pet from source...
CALL node node_modules\electron\cli.js .
if errorlevel 1 goto :error
exit /b 0

:error
echo.
echo ========================================
echo RUN FAILED
echo ========================================
echo.
echo The window will stay open so the error can be reviewed.
echo.
pause
exit /b 1
