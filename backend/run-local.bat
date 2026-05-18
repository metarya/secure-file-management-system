@echo off
setlocal

set "MAVEN_HOME=C:\Tools\apache-maven-3.9.15"
set "PATH=%MAVEN_HOME%\bin;%PATH%"

if not exist "%MAVEN_HOME%\bin\mvn.cmd" (
    echo ERROR: Maven not found at %MAVEN_HOME%\bin\mvn.cmd
    exit /b 1
)

for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
    set "%%A=%%B"
)

echo DB_PASSWORD loaded.
echo JWT_SECRET loaded.
echo Starting Spring Boot...

mvn.cmd spring-boot:run

endlocal
