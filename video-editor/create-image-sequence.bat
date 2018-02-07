@echo off
cls

cd "%userprofile%\Downloads"
ren *.avi 1.avi
rd /s /q 1
md 1

ffmpeg -hide_banner -i 1.avi -y 1\%%9d.png

pause
exit