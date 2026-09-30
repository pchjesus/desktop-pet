@echo off
setlocal
cd /d "%~dp0"
title Desktop Pet - Run
CALL node node_modules\electron\cli.js .
if errorlevel 1 (
  echo.
  echo Desktop Pet failed to start.
  pause
)
