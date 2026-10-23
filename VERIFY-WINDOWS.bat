@echo off
setlocal
cd /d "%~dp0"
title Desktop Pet - Windows EXE Smoke Test

echo ========================================
echo Desktop Pet v0.1.12 Windows EXE Smoke Test
echo ========================================
echo.

if not exist "dist\DesktopPet-0.1.12-portable.exe" goto :missing

echo [1/2] Running source regression checks...
CALL npm.cmd test
if errorlevel 1 goto :error
CALL npm.cmd run check
if errorlevel 1 goto :error
CALL npm.cmd run test:shell
if errorlevel 1 goto :error

echo.
echo [2/2] Launching the packaged EXE for a process smoke test...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $exe=Join-Path (Get-Location).Path 'dist\DesktopPet-0.1.12-portable.exe'; $existing=@(Get-ChildItem -Path $env:TEMP -Filter 'desktop-pet-smoke-*.ready' -ErrorAction SilentlyContinue | ForEach-Object FullName); $started=Get-Date; $launcher=$null; $childPid=$null; $marker=$null; $passed=$false; try { $launcher=Start-Process -FilePath $exe -ArgumentList '--smoke-test' -PassThru; for($i=0;$i -lt 120;$i++){ Start-Sleep -Milliseconds 500; $marker=Get-ChildItem -Path $env:TEMP -Filter 'desktop-pet-smoke-*.ready' -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -gt $started.AddSeconds(-2) -and $existing -notcontains $_.FullName } | Sort-Object LastWriteTime -Descending | Select-Object -First 1; if($marker){ try { $info=Get-Content -LiteralPath $marker.FullName -Raw | ConvertFrom-Json; $childPid=[int]$info.pid; if($info.ready -and (Get-Process -Id $childPid -ErrorAction SilentlyContinue)){ $passed=$true; break } } catch { }; $marker=$null } }; if(-not $passed){ throw 'Packaged Electron renderer was not ready within 60 seconds' }; Write-Host ('Desktop Pet renderer ready. Electron PID=' + $childPid) } catch { [Console]::Error.WriteLine($_.Exception.Message) } finally { if($childPid){ Stop-Process -Id $childPid -Force -ErrorAction SilentlyContinue }; if($launcher){ Stop-Process -Id $launcher.Id -Force -ErrorAction SilentlyContinue }; if($marker){ Remove-Item -LiteralPath $marker.FullName -Force -ErrorAction SilentlyContinue } }; if(-not $passed){exit 1}; Write-Host 'Desktop Pet packaged smoke test: PASS';exit 0"
if errorlevel 1 goto :error

echo.
echo ========================================
echo EXE SMOKE TEST PASSED
echo ========================================
echo.
echo This verifies that the portable launcher starts an Electron child which loads the renderer and reports readiness within 60 seconds.
echo It does not replace manual visual checks for transparency, click-through, drag, and always-on-top behavior.
echo.
if not defined CI pause
exit /b 0

:missing
echo.
echo ========================================
echo EXE SMOKE TEST FAILED - EXE NOT FOUND
echo ========================================
echo.
echo Expected: dist\DesktopPet-0.1.12-portable.exe
echo Run BUILD-WINDOWS.bat first.
echo.
if not defined CI pause
exit /b 1

:error
echo.
echo ========================================
echo EXE SMOKE TEST FAILED
echo ========================================
echo.
if not defined CI pause
exit /b 1
