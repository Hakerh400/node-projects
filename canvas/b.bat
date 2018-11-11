@echo off
cls

call node --expose-gc main.js

echo.
echo Exit code: %errorlevel%