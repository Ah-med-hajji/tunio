@echo off
chcp 65001 >nul
title TUNEO - Premier lancement
echo.
echo  ████████╗██╗   ██╗███╗   ██╗███████╗ ██████╗
echo  ╚══██╔══╝██║   ██║████╗  ██║██╔════╝██╔═══██╗
echo     ██║   ██║   ██║██╔██╗ ██║█████╗  ██║   ██║
echo     ██║   ██║   ██║██║╚██╗██║██╔══╝  ██║   ██║
echo     ██║   ╚██████╔╝██║ ╚████║███████╗╚██████╔╝
echo     ╚═╝    ╚═════╝ ╚═╝  ╚═══╝╚══════╝ ╚═════╝
echo.
echo  Installation et premier lancement automatique
echo  ================================================
echo.

REM Check WSL is available
wsl echo "WSL OK" >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo  [ERREUR] WSL2 n'est pas installe sur cet ordinateur.
    echo.
    echo  Veuillez installer WSL2 en ouvrant PowerShell en administrateur et en tapant :
    echo    wsl --install
    echo  Puis redemarrez votre ordinateur et relancez ce script.
    echo.
    pause
    exit /b 1
)

echo  [OK] WSL2 detecte. Lancement de l'installation...
echo.

REM Convert Windows path to WSL path
FOR /F "delims=" %%i IN ('wsl wslpath -u "%~dp0"') DO SET "WSLDIR=%%i"

REM Run the setup script in WSL with a visible terminal
wsl bash "%WSLDIR%first_run.sh"

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERREUR] Une erreur s'est produite pendant l'installation.
    echo  Lisez les messages ci-dessus pour plus de details.
    pause
    exit /b 1
)

pause
