@echo off
cls

node --expose-gc main.js

echo.
echo Exit code: %errorlevel%