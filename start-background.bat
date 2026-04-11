@echo off
chcp 65001 >nul
title MUST星河论坛 - 后台运行

echo ========================================
echo    MUST星河论坛 - 后台启动
echo ========================================
echo.

cd /d "%~dp0"

echo 正在后台启动应用程序...
echo 应用程序将在后台运行，关闭此窗口不会停止应用
echo.

start /B javaw -jar target\app-0.0.1-SNAPSHOT.jar > logs\app.log 2>&1

echo 应用程序已启动！
echo 访问地址: http://localhost:8088
echo 管理员登录: http://localhost:8088/admin/login.html
echo 用户名: admin
echo 密码: admin123
echo.
echo 日志文件: logs\app.log
echo 要停止应用程序，请运行 stop.bat
echo.

timeout /t 3
