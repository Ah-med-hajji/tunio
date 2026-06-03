@echo off
chcp 65001 >nul
title TUNEO - Demarrage
echo.
echo  ████████╗██╗   ██╗███╗   ██╗███████╗ ██████╗
echo  ╚══██╔══╝██║   ██║████╗  ██║██╔════╝██╔═══██╗
echo     ██║   ██║   ██║██╔██╗ ██║█████╗  ██║   ██║
echo     ██║   ██║   ██║██║╚██╗██║██╔══╝  ██║   ██║
echo     ██║   ╚██████╔╝██║ ╚████║███████╗╚██████╔╝
echo     ╚═╝    ╚═════╝ ╚═╝  ╚═══╝╚══════╝ ╚═════╝
echo.
echo  Demarrage de la plateforme Tuneo
echo  ==================================
echo.

wsl echo "WSL OK" >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo  [ERREUR] WSL2 n'est pas installe. Lancez d'abord first_run.bat
    pause
    exit /b 1
)

FOR /F "delims=" %%i IN ('wsl wslpath -u "%~dp0"') DO SET "WSLDIR=%%i"

wsl bash "%WSLDIR%start.sh"

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERREUR] Echec du demarrage. Essayez de relancer first_run.bat
    pause
    exit /b 1
)

pause
