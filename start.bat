@echo off
chcp 65001 >nul
title API Gateway - 一键启动器
color 0b

echo ===================================================
echo       API 网关与本地代理服务 - 联合启动器
echo ===================================================
echo.

:: Check dependencies first
if exist "node_modules" goto skip_install
echo [!] 首次启动，正在为您安装依赖环境 (可能需要1-3分钟)...
call npm install
:skip_install

echo [1/2] 正在启动前端 React 管理面板...
start "前端控制台" cmd /k "npm run dev"

echo [2/2] 正在启动底层代理网关服务...
start "本地代理服务" cmd /k "node server.js"

echo.
echo ===================================================
echo 🚀 服务启动成功!
echo ===================================================
echo.
echo [系统状态]
echo  - 前端控制台: http://localhost:3000
echo  - 本地代理网关: 运行在同一环境的独立终端内，监听 3001 端口
echo.
echo [使用方法]
echo 1. 打开弹出的浏览器页面 http://localhost:3000
echo 2. 在左侧菜单点击"API 配置管理"，添加并保存你的目标大模型 API 和 Key
echo 3. 在新建的 API 卡片右上角点击 "拉起 CC" 按钮
echo 4. 系统会自动把新启动的 Claude Code 对接过去！
echo.
pause
