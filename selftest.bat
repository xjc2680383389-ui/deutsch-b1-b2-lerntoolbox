@echo off
chcp 936>nul
cd /d "%~dp0"
setlocal enabledelayedexpansion
title 德语 B1/B2 学习工具箱  -  自检
echo.
echo   ==========================================
echo     德语 B1/B2 学习工具箱  -  自检
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

if not defined NODE_EXE goto :no_node

echo.
echo   运行环境：!NODE_EXE!
echo.
"!NODE_EXE!" js/selftest/run_all.js
if errorlevel 1 (
  echo.
  echo   自检未通过，请查看上面的失败项。
) else (
  echo.
  echo   自检全部通过。
)
echo.
pause
goto :eof

:no_node
echo.
echo   未能在本机找到 Node.js，无法运行自检。
echo.
echo   已检查的位置：
echo     - 系统 PATH 中的 node
echo     - %USERPROFILE%\nodejs
echo     - %LOCALAPPDATA%\Programs\nodejs
echo     - C:/Program Files\nodejs
echo.
echo   请安装 Node.js 后重试。
echo.
pause
