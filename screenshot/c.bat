@echo off
cls

cd addon
call node-gyp rebuild

cd ..