@echo off
cls

del "./package-lock.json"
rd /s /q "./node_modules"

call npm install --save-dev --build-from-source --GTK_Root="C:\Program Files\GTK" --jpeg_root="C:\Program Files\libjpeg-turbo64" canvas@next

cd node_modules
rd /s /q canvas
md canvas
cd canvas

call git init
call git remote add origin https://github.com/Hakerh400/node-canvas.git
call git fetch
call git checkout -t origin/test

call npm install --save assert-rejects

cd ..\..

call ./config-tests.bat
call ./build.bat
call ./test.bat