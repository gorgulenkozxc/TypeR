@echo off
chcp 65001 >nul @rem Set the code page to UTF-8
setlocal EnableDelayedExpansion 

@rem get the current extension version
for /f "tokens=5 delims=<>=/ " %%V in ('
    findstr /i "<Extension Id=\"typer\"" "CSXS\manifest.xml"
') do set "EXT_VERSION=%%~V"

@rem get the current locale name
for /f "tokens=3" %%a in (
    'reg query "HKCU\Control Panel\International" /v LocaleName 2^>nul'
) do set locale=%%a

@rem setting localized messages based on locale name from the registry
if "%locale:~0,2%"=="fr" (
    set msg_install="L'extension Photoshop TypeR v!EXT_VERSION! sera installée."
    set msg_close="Fermez Photoshop (s'il est ouvert)."
    set msg_complete="Installation terminée."
    set msg_open="Ouvrez Photoshop et dans le menu supérieur cliquez sur : [Fenêtre] ^> [Extensions] ^> [TypeR]"
    set msg_pause="Appuyez sur une touche pour continuer..."
    set msg_credits="Merci beaucoup à Swirt pour TyperTools et SeanR & Sakushi pour ce fork."
    set msg_discord="Discord de ScanR si besoin d'aide : https://discord.com/invite/Pdmfmqk"
) else if "%locale:~0,2%"=="es" (
    set msg_install="La extensión de Photoshop TypeR v!EXT_VERSION! se instalará."
    set msg_close="Cierra Photoshop (si está abierto)."
    set msg_complete="Instalación completada."
    set msg_open="Abre Photoshop y en el menú superior haz clic en lo siguiente: [Ventana] ^> [Extensiones] ^> [TypeR]"
    set msg_pause="Presiona cualquier tecla para continuar..."
    set msg_credits="Muchas gracias a Swirt por TyperTools y a SeanR & Sakushi por este fork."
    set msg_discord="Discord de ScanR si necesitas ayuda: https://discord.com/invite/Pdmfmqk"
) else if "%locale:~0,2%"=="pt" (
    set msg_install="Photoshop extension TypeR v!EXT_VERSION! will be installed."
    set msg_close="Feche o Photoshop (se estiver aberto)."
    set msg_complete="Instalação concluída."
    set msg_open="Abra o Photoshop e no menu superior clique em: [Janela] ^> [Extensões] ^> [TypeR]"
    set msg_pause="Pressione qualquer tecla para continuar..."
    set msg_credits="Muito obrigado a Swirt pelo TyperTools e a SeanR & Sakushi por este fork."
    set msg_discord="Discord do ScanR se precisar de ajuda: https://discord.com/invite/Pdmfmqk"
) else (
    set msg_install="Photoshop extension TypeR v!EXT_VERSION! will be installed."
    set msg_close="Close Photoshop (if it is open)."
    set msg_complete="Installation completed."
    set msg_open="Open Photoshop and in the upper menu click the following: [Window] ^> [Extensions] ^> [TypeR]"
    set msg_pause="Press any key to continue..."
    set msg_credits="Many thanks to Swirt for TyperTools and SeanR & Sakushi for this fork."
    set msg_discord="ScanR's Discord if you need help: https://discord.com/invite/Pdmfmqk"
)

echo %msg_install%
echo.
echo %msg_close%
echo.
echo %msg_pause%
PAUSE

for /l %%x in (6, 1, 12) do (
    reg query HKEY_CURRENT_USER\SOFTWARE\Adobe\CSXS.%%x 2>nul
    if !errorlevel! equ 0 (
        reg add HKEY_CURRENT_USER\SOFTWARE\Adobe\CSXS.%%x /t REG_SZ /v PlayerDebugMode /d 1 /f
    )
)

set Directory=%HOMEDRIVE%%HOMEPATH%\AppData\Roaming\Adobe\CEP\extensions\typertools
if exist "%Directory%\storage" copy "%Directory%\storage" __storage /Y
if exist "%Directory%" rmdir "%Directory%" /S/Q
if not exist "%Directory%\*" md "%Directory%"

xcopy app "%Directory%\app\" /E/Y
xcopy CSXS "%Directory%\CSXS\" /E/Y
xcopy icons "%Directory%\icons\" /E/Y
xcopy locale "%Directory%\locale\" /E/Y
xcopy themes "%Directory%\app\themes\" /E/Y
if exist .debug copy .debug "%Directory%\.debug" /Y
if exist __storage (
    copy __storage "%Directory%\storage" /Y
    del __storage /F
)

echo. & echo.
echo %msg_complete%
echo %msg_open%
echo.
echo %msg_credits%
echo %msg_discord%
echo.

echo %msg_pause%
PAUSE
