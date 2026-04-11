@echo off
chcp 65001 >nul
title MUST星河论坛 - 机器人管理系统

echo ========================================
echo    MUST星河论坛 - 机器人管理系统
echo ========================================
echo.
echo 正在启动应用程序...
echo.

cd /d "%~dp0"

java -jar target\app-0.0.1-SNAPSHOT.jar

pause
