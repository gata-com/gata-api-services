@echo off
REM Build verification script for Windows

echo Verifying build configuration...

REM Check if package.json exists
if not exist "package.json" (
    echo package.json not found
    exit /b 1
)
echo package.json found

REM Check if tsconfig.json exists
if not exist "tsconfig.json" (
    echo tsconfig.json not found
    exit /b 1
)
echo tsconfig.json found

REM Check if src directory exists
if not exist "src" (
    echo src directory not found
    exit /b 1
)
echo src directory found

REM Check if node_modules exists
if not exist "node_modules" (
    echo node_modules not found, installing dependencies...
    call npm install
)
echo node_modules found

REM Clean old build
if exist "dist" (
    echo Cleaning old build...
    rmdir /s /q dist
)

REM Build
echo Building application...
call npm run build

REM Verify build output
if not exist "dist" (
    echo Build failed: dist directory not created
    exit /b 1
)

if not exist "dist\server.js" (
    echo Build failed: server.js not found in dist
    exit /b 1
)

echo.
echo Build verification completed successfully!
echo.
echo Next steps:
echo 1. Test locally: npm start
echo 2. Deploy to VPS: git push origin main
echo 3. Check PM2 status: pm2 list
echo 4. View logs: pm2 logs gata-api-services
