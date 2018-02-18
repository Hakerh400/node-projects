@echo off
cls

cd ./node_modules/canvas
start node-gyp rebuild --GTK_Root="C:\Program Files\GTK"
cd ../..