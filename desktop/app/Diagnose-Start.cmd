@echo off
setlocal
cd /d "%~dp0"
title STYLE ORBIT - Diagnose Start
echo ============================================
echo  STYLE / ORBIT - diagnostic launcher
echo ============================================
echo.

if not exist "runtime\STYLE-ORBIT-core.exe" (
  echo [ERROR] runtime\STYLE-ORBIT-core.exe is missing.
  echo Please EXTRACT THE WHOLE ZIP first.
  goto :end
)
if not exist "runtime\resources\app\ui\index.html" (
  echo [ERROR] The application folder is incomplete.
  echo Please EXTRACT THE WHOLE ZIP first, then run this file from the extracted folder.
  echo Do NOT run the exe from inside the ZIP preview window.
  goto :end
)

echo Starting STYLE-ORBIT with compatibility flags and logging...
echo Keep this window open while the app runs.
echo.
set ELECTRON_ENABLE_LOGGING=1
"runtime\STYLE-ORBIT-core.exe" --no-sandbox --disable-gpu --enable-unsafe-swiftshader --enable-logging=stderr
set "CODE=%ERRORLEVEL%"
echo.
echo STYLE-ORBIT exited with code: %CODE%
echo.
echo Startup log:
if exist "%APPDATA%\STYLE ORBIT\startup.log" (
  echo   %APPDATA%\STYLE ORBIT\startup.log
  echo.
  powershell -NoProfile -Command "Get-Content -LiteralPath (Join-Path $env:APPDATA 'STYLE ORBIT\startup.log') -Tail 30"
) else (
  echo   Not created yet.
)
echo.
echo If no window appeared, copy the text above and send it to the developer.
:end
echo.
pause
