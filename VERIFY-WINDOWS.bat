@echo off
setlocal
cd /d "%~dp0"
title Desktop Pet - Windows EXE Smoke Test

echo ========================================
echo Desktop Pet v0.1.8 Windows EXE Smoke Test
 echo ========================================
echo.

if not exist "dist\DesktopPet-0.1.8-portable.exe" goto :missing

echo [1/2] Running source regression checks...
CALL npm.cmd test
if errorlevel 1 goto :error
CALL npm.cmd run check
if errorlevel 1 goto :error
CALL npm.cmd run test:shell
if errorlevel 1 goto :error

echo.
echo [2/2] Launching the packaged EXE for a process smoke test...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$exe = '%CD%\dist\DesktopPet-0.1.8-portable.exe'; $p = Start-Process -FilePath $exe -ArgumentList '--smoke-test' -PassThru; $marker = Join-Path $env:TEMP ('desktop-pet-smoke-' + $p.Id + '.ready'); $ready = $false; for ($i=0; $i -lt 20; $i++) { Start-Sleep -Milliseconds 500; if ($p.HasExited) { Write-Error ('Desktop Pet exited during smoke test. ExitCode=' + $p.ExitCode); exit 1 }; if (Test-Path $marker) { $ready = $true; break } }; if (-not $ready) { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue; Write-Error 'Desktop Pet process stayed alive but did not report renderer readiness within 10 seconds.'; exit 1 }; Write-Host ('Desktop Pet renderer is ready. PID=' + $p.Id); Stop-Process -Id $p.Id -Force; Remove-Item $marker -Force -ErrorAction SilentlyContinue; Write-Host 'Desktop Pet packaged smoke test: PASS'; exit 0"
if errorlevel 1 goto :error

echo.
echo ========================================
echo EXE SMOKE TEST PASSED
echo ========================================
echo.
echo This verifies that the packaged process can launch, load the renderer, and report readiness within 10 seconds.
echo It does not replace manual visual checks for transparency, click-through, drag, and always-on-top behavior.
echo.
pause
exit /b 0

:missing
echo.
echo ========================================
echo EXE SMOKE TEST FAILED - EXE NOT FOUND
echo ========================================
echo.
echo Expected: dist\DesktopPet-0.1.8-portable.exe
echo Run BUILD-WINDOWS.bat first.
echo.
pause
exit /b 1

:error
echo.
echo ========================================
echo EXE SMOKE TEST FAILED
echo ========================================
echo.
pause
exit /b 1
