# 刷题宝 Android APK 打包指南

## 当前状态

- ✅ Capacitor 已初始化（appId: `com.shuatibao.app`，appName: `刷题宝`）
- ✅ Android 平台已添加（`android/` 目录）
- ✅ 静态导出已完成（`out/` 目录，313 个文件）
- ✅ `npx cap sync` 已成功
- ❌ 缺少 Java JDK 和 Android SDK，无法在当前机器构建 APK

---

## 需要安装的工具

### 1. Java JDK 17

- **下载**: https://adoptium.net/temurin/releases/?os=windows&arch=x64&package=jdk&version=17
- 选择 **Windows x64 JDK .msi** 安装包
- 安装时勾选 **"Set JAVA_HOME variable"**

### 2. Android Studio（含 Android SDK）

- **下载**: https://developer.android.com/studio
- 安装 Android Studio，首次启动会自动下载 Android SDK
- 在 SDK Manager 中确保安装了：
  - **Android SDK Platform 34**（或更高版本）
  - **Android SDK Build-Tools**
  - **Android SDK Command-line Tools**

---

## 环境变量设置

安装完成后，设置以下环境变量（系统属性 → 高级 → 环境变量）：

| 变量名 | 值（示例） |
|--------|-----------|
| `JAVA_HOME` | `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot` |
| `ANDROID_HOME` | `C:\Users\你的用户名\AppData\Local\Android\Sdk` |
| `ANDROID_SDK_ROOT` | 同 `ANDROID_HOME` |

并在 **Path** 中添加：
- `%JAVA_HOME%\bin`
- `%ANDROID_HOME%\platform-tools`
- `%ANDROID_HOME%\cmdline-tools\latest\bin`

设置后**重启终端**，验证：

```powershell
java -version          # 应显示 JDK 17
echo $env:ANDROID_HOME # 应显示 SDK 路径
```

---

## 一键打包步骤

环境变量设置好后，在项目根目录（`e:\qoderxm\题库`）执行：

```powershell
# 1. 重新构建静态文件（如有代码更新）
npm run build

# 2. 同步到 Android 项目
npx cap sync

# 3. 构建 Debug APK
cd android
.\gradlew.bat assembleDebug

# 4. APK 输出位置
# android\app\build\outputs\apk\debug\app-debug.apk
```

或者直接运行项目根目录的 `build-apk.bat` 脚本。

---

## 构建 Release APK（可选）

```powershell
cd android
.\gradlew.bat assembleRelease
# 输出: android\app\build\outputs\apk\release\app-release-unsigned.apk
```

Release 版需要签名才能安装，签名步骤参考：
https://developer.android.com/studio/publish/app-signing

---

## 自定义应用图标

当前使用 Capacitor 默认图标。要替换为自己的图标：

1. 准备一张 **1024x1024** 的 PNG 图片
2. 安装图标生成工具：`npm install -g @capacitor/assets`
3. 将图片放到 `resources/icon.png`
4. 运行：`npx capacitor-assets generate --android`
5. 重新同步：`npx cap sync`

---

## 常见问题

### Q: 构建时提示 "SDK location not found"
在 `android/` 目录创建 `local.properties` 文件：
```
sdk.dir=C:\\Users\\你的用户名\\AppData\\Local\\Android\\Sdk
```

### Q: 构建时 Gradle 下载很慢
可以配置国内镜像，在 `android/build.gradle` 中将 `google()` 和 `mavenCentral()` 替换为阿里云镜像。

### Q: 安装 APK 时提示 "未知来源"
在手机上开启：**设置 → 安全 → 允许安装未知来源应用**
