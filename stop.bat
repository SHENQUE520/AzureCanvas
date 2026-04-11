@echo off
chcp 65001 >nul
title MUST星河论坛 - 停止应用

echo ========================================
echo    MUST星河论坛 - 停止应用程序
echo ========================================
echo.

echo 正在停止应用程序...
taskkill /F /IM javaw.exe /FI "WINDOWTITLE eq MUST星河论坛*" >nul 2>&1

if %errorlevel% == 0 (
    echo 应用程序已成功停止！
) else (
    echo 未找到运行中的应用程序
)

echo.
pause
