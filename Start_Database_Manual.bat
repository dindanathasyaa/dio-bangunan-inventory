@echo off
color 0A
title Mesin Database MySQL - Dio Bangunan
echo ========================================================
echo MENGHIDUPKAN MESIN DATABASE MYSQL SECARA MANUAL...
echo ========================================================
echo.
echo Mohon jangan tutup jendela ini selama aplikasi sedang digunakan!
echo Tekan CTRL+C jika ingin mematikan database.
echo.
C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysqld.exe --console
pause
