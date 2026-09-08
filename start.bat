@echo off
chcp 936>nul
cd /d "%~dp0"
setlocal enabledelayedexpansion
title 德语 B1/B2 学习工具箱  -  一键启动
echo.
echo   ==========================================
echo     德语 B1/B2 学习工具箱  -  一键启动
echo   ==========================================
echo.
echo   正在检查本机运行环境 ...

rem ===== 第一步：寻找 Node.js（不依赖系统 PATH，逐个常见位置探测）=====
set "NODE_EXE="
where node >nul 2>nul
if not errorlevel 1 set "NODE_EXE=node"

if not defined NODE_EXE (
  if exist "%USERPROFILE%\nodejs\node.exe" set "NODE_EXE=%USERPROFILE%\nodejs\node.exe"
)
if not defined NODE_EXE (
  for /d %%D in ("%USERPROFILE%\nodejs\*") do (
    if exist "%%D\node.exe" set "NODE_EXE=%%D\node.exe"
  )
)
if not defined NODE_EXE (
  for /d %%D in ("%LOCALAPPDATA%\Programs\nodejs\*") do (
    if exist "%%D\node.exe" set "NODE_EXE=%%D\node.exe"
  )
)
if not defined NODE_EXE (
  if exist "C:/Program Files/nodejs/node.exe" set "NODE_EXE=C:/Program Files\nodejs\node.exe"
)
if not defined NODE_EXE (
  if exist "C:/Program Files (x86)/nodejs/node.exe" set "NODE_EXE=C:/Program Files (x86)\nodejs\node.exe"
)

if defined NODE_EXE goto :run_node

rem ===== 第二步：Node.js 没找到，继续寻找 Python =====
set "PY_EXE="
where py >nul 2>nul
if not errorlevel 1 set "PY_EXE=py -3"

if not defined PY_EXE (
  where python >nul 2>nul
  if not errorlevel 1 set "PY_EXE=python"
)
if not defined PY_EXE (
  for /d %%D in ("%LOCALAPPDATA%\Programs\Python\Python3*") do (
    if exist "%%D\python.exe" set "PY_EXE=%%D\python.exe"
  )
)
if not defined PY_EXE (
  for /d %%D in ("%USERPROFILE%\AppData\Local\Programs\Python\Python3*") do (
    if exist "%%D\python.exe" set "PY_EXE=%%D\python.exe"
  )
)
if not defined PY_EXE (
  if exist "C:/Python312/python.exe" set "PY_EXE=C:/Python312/python.exe"
)
if not defined PY_EXE (
  if exist "C:/Python313/python.exe" set "PY_EXE=C:/Python313/python.exe"
)

if defined PY_EXE goto :run_python
goto :no_runtime

:run_node
echo.
echo   运行环境：!NODE_EXE!
echo   本机服务目录：%CD%
echo.
echo   正在启动本地服务，请保持本窗口开启。
echo   关闭本窗口即可停止服务。
echo.
"!NODE_EXE!" server.js
echo.
echo   服务已停止（或启动失败）。若上面的提示包含错误信息，请记录下来。
echo.
pause
goto :eof

:run_python
echo.
echo   运行环境：!PY_EXE!
echo   本机服务目录：%CD%
echo.
echo   未找到 Node.js，改用 Python 静态服务启动（功能完全一致）。
echo   正在启动本地服务，请保持本窗口开启。
echo   关闭本窗口即可停止服务。
echo.
start "" http://127.0.0.1:8123/index.html
"!PY_EXE!" -m http.server 8123 --bind 127.0.0.1
echo.
echo   服务已停止（或启动失败）。若端口 8123 被占用，会看到地址已被占用的提示。
echo.
pause
goto :eof

:no_runtime
echo.
echo   未能在本机找到 Node.js 或 Python，无法启动本地服务。
echo.
echo   已检查的位置：
echo     - 系统 PATH 中的 node / py / python
echo     - %USERPROFILE%\nodejs
echo     - %LOCALAPPDATA%\Programs\nodejs
echo     - C:/Program Files\nodejs
echo     - %LOCALAPPDATA%\Programs\Python\Python3*
echo.
echo   请安装 Node.js（推荐，官网 https 版本任选一个 LTS 安装包）后重试。
echo.
pause
