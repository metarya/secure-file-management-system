@echo off
setlocal enabledelayedexpansion

set "MAVEN_HOME=C:\Tools\apache-maven-3.9.15"
set "PATH=%MAVEN_HOME%\bin;%PATH%"

if not exist "%MAVEN_HOME%\bin\mvn.cmd" (
    echo ERROR: Maven not found at %MAVEN_HOME%\bin\mvn.cmd
    exit /b 1
)

if not exist ".env" (
    echo ERROR: .env file not found.
    exit /b 1
)

for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env") do (
    if not "%%A"=="" (
        set "%%A=%%B"
    )
)

if not defined DB_PASSWORD (
    echo ERROR: DB_PASSWORD not found in .env
    exit /b 1
)

if not defined JWT_SECRET (
    echo ERROR: JWT_SECRET not found in .env
    exit /b 1
)

if not defined APP_STORAGE_ENCRYPTION_KEY (
    echo ERROR: APP_STORAGE_ENCRYPTION_KEY not found in .env
    exit /b 1
)

echo DB_PASSWORD loaded.
echo JWT_SECRET loaded.
echo APP_STORAGE_ENCRYPTION_KEY loaded.
echo Starting Spring Boot...

mvn.cmd spring-boot:run

endlocal
