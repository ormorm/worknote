@echo off
mode con lines=27 cols=60
%1 mshta vbscript:CreateObject("Shell.Application").ShellExecute("cmd.exe","/c %~s0 ::","","runas",1)(window.close)&&exit
cd /d "%~dp0"
:main
cls
color 2f
echo √√    √√  √√√      √√√√  √√√√√    √√√√
echo   √    √  √      √  √      √  √  √  √  √      √
echo   √    √  √      √  √              √      √
echo   √√√√  √      √    √√          √        √√
echo   √    √  √      √        √        √            √
echo   √    √  √      √          √      √              √
echo   √    √  √      √  √      √      √      √      √
echo √√    √√  √√√    √√√√      √√√    √√√√
echo.----------------------------------------------------------- 
echo.如有360等安全软件提醒，请勾选允许和不再提醒！
echo.
echo.警告：执行该命令你的原hosts将被覆盖！
echo.
echo.老D博客 LAOD.CN LAOD.ORG LAOD.TOP
echo.2016 永久更新地址：
echo.http://laod.cn/hosts/2016-google-hosts.html
color 2e
echo.-----------------------------------------------------------
echo.请选择使用：
echo.
echo. 1.使用穿墙host
echo.
echo. 2.恢复初始host	
echo.-----------------------------------------------------------

if exist "%SystemRoot%\System32\choice.exe" goto Win7Choice

set /p choice=请输入数字并按回车键确认:

echo.
if %choice%==1 goto host DNS
if %choice%==2 goto CL
cls
"set choice="
echo 您输入有误，请重新选择。
ping 127.0.1 -n "2">nul
goto main

:Win7Choice
choice /c 12 /n /m "请输入相应数字："
if errorlevel 2 goto CL
if errorlevel 1 goto host DNS
cls
goto main

:host DNS
cls
color 2f
copy /y "hosts" "%SystemRoot%\System32\drivers\etc\hosts"
ipconfig /flushdns
echo.-----------------------------------------------------------
echo.
echo 老D恭喜您，覆盖本地hosts并刷新本地DNS解析缓存成功!
echo.
echo 现在去打开Google、Twitter、Facebook、Gmail、谷歌学术吧！
echo.
goto end

:CL
cls
color 2f
@echo 127.0.0.1 localhost > %SystemRoot%\System32\drivers\etc\hosts
echo 恭喜您，hosts恢复初始成功!
echo.
goto end

:end
echo 请按任意键退出。
@Pause>nul