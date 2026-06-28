@echo off
echo Compiling TravHubLauncher...

set CSC="C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"

if not exist %CSC% (
    echo Error: C# compiler not found. Are you on Windows?
    pause
    exit /b 1
)

%CSC% /target:winexe /out:TravHubLauncher.exe Launcher.cs

if %errorlevel% neq 0 (
    echo Compilation failed!
    pause
    exit /b %errorlevel%
)

echo.
echo Compilation successful! You can now run TravHubLauncher.exe
pause
