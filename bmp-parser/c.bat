@echo off
cls

cd addon
call node-gyp build

cd ..