@echo off
chcp 65001 >nul
cls
title AzureCanvas 精准上传脚本
echo ====================================================
echo          🔥  正在上传核心代码：app + demo
echo ====================================================
echo.

:: 拉取远程最新代码（不弹Vim）
git pull origin main --no-edit --allow-unrelated-histories

:: 只添加实际存在的核心文件/文件夹
git add app demo pom.xml README.md LICENSE Github.bat

:: 提交（包含脚本文件的修改）
git commit -m "Auto-Update: 上传app/demo及配置文件 %date% %time%"

:: 推送到GitHub
git push origin main

echo.
echo ====================================================
echo ✅ 上传成功！去GitHub查看最新状态！
echo ====================================================
pause