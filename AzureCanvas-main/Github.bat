@echo off
chcp 65001 >nul
echo ==============================================
echo          一键上传项目到 GitHub
echo          双击运行，无需任何操作
echo ==============================================
echo.

:: 拉取远程最新代码（自动处理冲突）
git pull origin main --no-edit --allow-unrelated-histories

:: 添加所有文件
git add .

:: 提交
git commit -m "自动更新：%date% %time%"

:: 推送到 GitHub
git push origin main

echo.
echo ✅ 上传完成！刷新 GitHub 页面即可看到
echo.
pause