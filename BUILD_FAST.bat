@echo off
echo ========================================
echo LetsBunk Fast Build Script
echo ========================================
echo.

REM Set Android SDK environment variables
echo Setting up Android SDK environment...
set ANDROID_HOME=C:\Users\ASUS\AppData\Local\Android\Sdk
set ANDROID_SDK_ROOT=C:\Users\ASUS\AppData\Local\Android\Sdk
set "PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%ANDROID_HOME%\tools\bin;%ANDROID_HOME%\build-tools\34.0.0;%PATH%"

echo ✅ ANDROID_HOME: %ANDROID_HOME%
echo ✅ ANDROID_SDK_ROOT: %ANDROID_SDK_ROOT%
echo.

REM Quick SDK verification
if not exist "%ANDROID_HOME%\platform-tools\adb.exe" (
    echo ❌ Android SDK not found at: %ANDROID_HOME%
    echo Please install Android Studio and SDK first
    pause
    exit /b 1
)
echo ✅ Android SDK verified
echo.

REM Step 1: Kill interfering processes quickly
echo Step 1: Cleaning processes...
taskkill /F /IM adb.exe 2>nul
taskkill /F /IM java.exe 2>nul
timeout /t 1 /nobreak >nul
echo.

REM Step 2: Quick clean (skip full clean for speed)
echo Step 2: Quick clean...
cd android
if exist "app\build\outputs\apk\release\*.apk" (
    del /F /Q "app\build\outputs\apk\release\*.apk" 2>nul
)
cd ..
if exist "app-release-*.apk" (
    del /F /Q "app-release-*.apk" 2>nul
)
echo ✅ Old APKs removed
echo.

REM Step 3: Fast build (skip daemon stop for speed)
echo Step 3: Building APK (Fast Mode)...
echo This should take 2-3 minutes...
cd android
call gradlew assembleRelease --no-daemon --parallel
set BUILD_RESULT=%ERRORLEVEL%
cd ..
echo.

REM Step 4: Process result
if %BUILD_RESULT% EQU 0 (
    echo ✅ Build completed successfully!
    
    if exist "android\app\build\outputs\apk\release\app-release.apk" (
        copy /Y "android\app\build\outputs\apk\release\app-release.apk" "app-release-latest.apk" >nul
        echo ✅ APK ready: app-release-latest.apk
        
        for %%A in ("app-release-latest.apk") do set APK_SIZE=%%~zA
        if defined APK_SIZE (
            set /a APK_SIZE_MB=%APK_SIZE%/1024/1024
        ) else (
            set APK_SIZE_MB=Unknown
        )
        echo ✅ Size: %APK_SIZE_MB% MB
        echo.
        
        REM Quick install check
        adb devices > temp_devices.txt 2>nul
        findstr /C:"device" temp_devices.txt | findstr /V /C:"List of devices" >nul
        if %ERRORLEVEL% EQU 0 (
            echo ✅ Device detected - installing...
            adb install -r "app-release-latest.apk"
            if %ERRORLEVEL% EQU 0 (
                echo ✅ SUCCESS! APK installed on device
            ) else (
                echo ⚠️ Install failed - APK ready for manual install
            )
        ) else (
            echo ⚠️ No device connected - APK ready: app-release-latest.apk
        )
        del temp_devices.txt 2>nul
        
        echo.
        echo ========================================
        echo ✅ FAST BUILD COMPLETE
        echo ========================================
        echo APK: app-release-latest.apk (%APK_SIZE_MB% MB))
        echo Time: Fast mode (2-3 minutes)
        echo ========================================
    ) else (
        echo ❌ APK not found after build
    )
) else (
    echo ❌ Build failed with error: %BUILD_RESULT%
    echo Try running BUILD_APK_PROPER_SDK.bat for detailed output
)

echo.
pause