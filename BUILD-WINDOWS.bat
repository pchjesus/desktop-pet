@echo off
setlocal
cd /d "%~dp0"
title Desktop Pet - Windows Build

echo ========================================
echo Desktop Pet Windows Build v0.1.12
echo ========================================
echo.

echo [1/5] Installing dependencies...
CALL npm.cmd install
if errorlevel 1 goto :error

echo.
echo [2/5] Preparing and verifying the local Electron runtime...
CALL npm.cmd run prepare:electron
if errorlevel 1 goto :error
node scripts\verify-electron.js
if errorlevel 1 goto :error

echo.
echo [3/5] Running automated tests...
CALL npm.cmd test
if errorlevel 1 goto :error

echo.
echo [4/5] Running syntax and desktop-shell regression checks...
CALL npm.cmd run check
if errorlevel 1 goto :error
node test\desktop-shell.test.js
if errorlevel 1 goto :error

echo.
echo [5/5] Building portable Windows EXE...
CALL npm.cmd run dist
if errorlevel 1 goto :error

if not exist "dist\DesktopPet-0.1.12-portable.exe" goto :artifact_error

echo.
echo ========================================
echo BUILD SUCCESS
echo ========================================
echo.
echo EXE: dist\DesktopPet-0.1.12-portable.exe
echo.
echo NOTE: The EXE artifact was created. Visual Windows runtime validation is a separate step.
echo.
pause
exit /b 0

:artifact_error
echo.
echo ========================================
echo BUILD FAILED - EXE NOT FOUND
echo ========================================
echo.
pause
exit /b 1

:error
echo.
echo ========================================
echo BUILD FAILED
echo ========================================
echo.
pause
exit /b 1
