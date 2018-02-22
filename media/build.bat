@echo off
cls

cd ./node_modules/canvas
call node-gyp rebuild --GTK_Root="C:\Program Files\GTK"
cd ../..