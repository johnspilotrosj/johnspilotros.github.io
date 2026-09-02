@echo off
setlocal
set "DEST=%USERPROFILE%\Desktop\spilo-xyz-site"

echo === Deploying /admin, /leads, /signin to spilo.xyz ===
echo.

if not exist "%DEST%" (
  echo ERROR: %DEST% not found. Clone the site repo there first.
  pause
  exit /b 1
)

rem /signin, /admin and /dashboard borrow the React site's stylesheet by its
rem exact built filename, and that filename changes every time the site is
rem rebuilt. Repoint them first or they deploy with no styling at all, which
rem matters most for /signin, the page the printed QR codes lead to.
echo.
echo Pointing the pages at the current site build...
node "%~dp0spilo\sync-assets.js"
if errorlevel 1 (
  echo.
  echo NOTE: could not read the site build, so asset names were left alone.
  echo If you have not rebuilt the React site lately that is fine. If you
  echo have, /signin and /admin may lose their styling after this deploy.
  echo.
)

node "%~dp0spilo\build-dashboard.js"
if errorlevel 1 (
  echo ERROR: the dashboard failed to build. Nothing was deployed.
  pause
  exit /b 1
)

cd /d "%DEST%"

git config user.email "johnspilotros@gmail.com"
git config user.name "johnspilotrosj"

echo.
echo Copying pages into the site repo...
for %%D in (admin leads signin qr dashboard) do (
  if not exist "%DEST%\%%D" mkdir "%DEST%\%%D"
  copy /y "%~dp0spilo\%%D\index.html" "%DEST%\%%D\index.html" >nul
)

echo.
echo Staging, committing, and pushing...
git add admin leads signin qr dashboard
git commit -m "Update dashboard, admin, leads, signin, and qr pages"
set COMMIT_ERR=%errorlevel%

git push
if errorlevel 1 (
  echo.
  echo ============================================================
  echo PUSH FAILED. Git probably needs you to sign in to GitHub
  echo ^(a browser window or credential prompt may have opened
  echo behind this one - check for it^). Nothing more was attempted.
  echo ============================================================
) else (
  if %COMMIT_ERR% NEQ 0 (
    echo.
    echo ============================================================
    echo NOTE: the commit step reported an issue above. Nothing may
    echo have changed since the last deploy. Check before trusting
    echo the success message below.
    echo ============================================================
  )
  echo.
  echo ============================================================
  echo Pushed to main. GitHub Pages will rebuild in about a minute.
  echo   Admin:   https://spilo.xyz/admin
  echo   Leads:   https://spilo.xyz/leads
  echo   QR sign: https://spilo.xyz/qr
  echo   Sign in: https://spilo.xyz/signin?p=123 Main St, Boise
  echo ============================================================
)

echo.
echo Done. Press any key to close.
pause >nul
