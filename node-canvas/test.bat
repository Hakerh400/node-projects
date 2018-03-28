@echo off
cls

cd ./node_modules/canvas
call npm test --GTK_Root="C:\Program Files\GTK" --jpeg_root="C:\Program Files\libjpeg-turbo64"
cd ../..