@echo off
chcp 65001 >nul
echo ========================================
echo   刷题宝 Android APK 打包脚本
echo ========================================
echo.

:: 检查 Java
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Java JDK，请先安装 JDK 17
    echo 下载地址: https://adoptium.net/temurin/releases/
    pause
    exit /b 1
)
echo [✓] Java JDK 已检测到

:: 检查 ANDROID_HOME
if "%ANDROID_HOME%"=="" (
    echo [错误] ANDROID_HOME 环境变量未设置
    echo 请安装 Android Studio 并设置 ANDROID_HOME
    pause
    exit /b 1
)
echo [✓] ANDROID_HOME = %ANDROID_HOME%

echo.
echo [1/3] 构建 Next.js 静态文件...
call npm run build
if %errorlevel% neq 0 (
    echo [错误] Next.js 构建失败
    pause
    exit /b 1
)

echo.
echo [2/3] 同步 Web 资源到 Android 项目...
call npx cap sync
if %errorlevel% neq 0 (
    echo [错误] Capacitor 同步失败
    pause
    exit /b 1
)

echo.
echo [3/3] 构建 Release APK（正式版）...
cd android
call gradlew.bat assembleRelease
if %errorlevel% neq 0 (
    echo [错误] APK 构建失败
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo   打包完成！
echo   APK 位置: android\app\build\outputs\apk\release\app-release.apk
echo ========================================
echo.

:: 复制到 E:\qoderxm\lj\项目输出
if not exist "E:\qoderxm\lj\项目输出" mkdir "E:\qoderxm\lj\项目输出"
copy "android\app\build\outputs\apk\release\app-release.apk" "E:\qoderxm\lj\项目输出\刷题宝.apk" >nul
echo APK 已复制到: E:\qoderxm\lj\项目输出\刷题宝.apk

pause
