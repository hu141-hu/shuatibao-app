# 发布新版本流程

## 概述

刷题宝应用采用**服务端版本检查 + 浏览器下载 APK**的自动更新机制。每次发布新版本都需要遵循以下流程。

## 步骤详解

### 1. 修改版本号

需要在三个文件中同步更新版本号：

#### a) package.json (主版本信息)
```json
{
  "name": "quiz-app",
  "version": "1.1.0",        // 👈 更新此处
  "private": true,
  ...
}
```

#### b) public/version.json (客户端版本检测)
```json
{
  "version": "1.1.0",          // 👈 更新此处（与 package.json 保持一致）
  "versionCode": 11,           // 👈 数字版本号（v1.x.x → 1x）
  "downloadUrl": "https://github.com/your-repo/shuatibao/releases/download/v1.1.0/app-release.apk",
  "changelog": "v1.1.0 (2024-07-31)\n\n新功能：\n- 新增删除题库目录功能\n- 优化分类管理界面\n- 改进暗黑模式适配\n\n修复：\n- 修复 bankId 不一致导致的问题\n- 优化导入速度\n- 其他小优化",
  "forceUpdate": false
}
```

**versionCode 命名规则**:
- v1.0.0 → 100
- v1.1.0 → 110  
- v2.0.0 → 200

#### c) android/app/build.gradle (Android 构建配置)
```gradle
android {
    ...
    defaultConfig {
        versionCode 11              // 👈 与 public/version.json 一致
        versionName "1.1.0"         // 👈 与 package.json 一致
        ...
    }
}
```

---

### 2. 编写更新日志

在 `public/version.json` 中编写清晰的更新日志:

```
v1.1.0 (2024-07-31)

新功能:
- 新增删除题库目录功能
- 优化分类管理界面
- 改进暗黑模式适配

修复:
- 修复 bankId 不一致导致的问题
- 优化导入速度
- 其他小优化
```

**格式要求**:
- 第一行：版本号 + 发布日期
- 空一行
- 功能分区标题 + 冒号
- 每个条目使用 `-` 前缀
- 用 `\n\n` 分隔不同部分

---

### 3. 打包 APK

#### Windows PowerShell 命令:
```powershell
# 编译 Web 项目
cd E:\qoderxm\tiku
npm run build

# 同步 Capacitor 配置
npm run cap:sync

# 进入 Android 目录并构建 Release APK
cd android
.\gradlew.bat assembleRelease
```

**产物位置**:
- Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release APK: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

**签名 Release APK** (推荐):
```powershell
# 使用已有的密钥库签名
.\gradlew.bat bundleRelease
```

签名的 APK 会在: `android/app/build/outputs/bundle/release/app-release.aab`

如果需要生成签名的 APK:
```bash
# 在 Android Studio 中操作:
# Build > Generate Signed Bundle / APK > APK > 选择密钥库
```

---

### 4. 上传到 GitHub Releases

1. **访问发布页面**: https://github.com/shuatibao/app/releases

2. **创建新 Release**:
   - Tag version: `v1.1.0` (格式：v + 版本号)
   - Target: `main` 分支
   - Title: `v1.1.0 - 新功能与优化`
   - Description: 粘贴 `public/version.json` 中的 changelog

3. **上传文件**:
   - ✅ Set as the latest release
   - Upload file: `app-release.apk` 或 `app-release.aab`

4. **获取下载链接**:
   ```
   https://github.com/shuatibao/app/releases/download/v1.1.0/app-release.apk
   ```

5. **更新 public/version.json**:
   ```json
   {
     "downloadUrl": "https://github.com/shuatibao/app/releases/download/v1.1.0/app-release.apk"
   }
   ```

6. **提交更改**:
   ```powershell
   git add public/version.json
   git commit -m "chore: update version to v1.1.0 and release URL"
   git push
   ```

---

### 5. 测试验证

#### 卸载旧版 (如果是 debug 转 release):
```powershell
# 通过 ADB 卸载
adb uninstall com.quiz.app

# 或在 Android 设备上设置 → 应用 → 刷题宝 → 卸载
```

#### 安装最新版:
```powershell
# 通过 ADB 安装
adb install app-release.apk

# 或手动下载安装包后直接安装
```

#### 验证功能:
1. ✅ 打开应用，应该看到首页
2. ✅ 等待 1 秒，应该弹出更新提示
3. ✅ 点击"稍后提醒",弹窗关闭
4. ✅ 进入"我的"页面
5. ✅ 点击"检查更新"按钮
6. ✅ 验证检测到最新版本
7. ✅ 点击"立即更新",应该打开浏览器下载 APK

---

## 常见问题

### Q1: 版本检测失败怎么办？
**A**: 检查以下几点:
- 网络连接正常
- `public/version.json` 可通过 HTTPS 访问
- GitHub Raw 未被防火墙拦截
- 浏览器控制台查看错误日志

### Q2: 为什么没有弹出更新提示？
**A**: 
- 检查是否是同一天内重复测试（限制每天只提示一次）
- 清除 localStorage: `localStorage.clear()`
- 检查版本号比较逻辑是否正确

### Q3: forceUpdate 的作用是什么？
**A**: 
- `false`: 用户可跳过更新
- `true`: 用户必须更新才能继续使用（强制更新）

适用于重大安全更新或严重 Bug 修复场景。

### Q4: versionCode 和 version 有什么区别？
**A**:
- `version`: 语义化版本号，用户可见 ("1.1.0")
- `versionCode`: 内部递增整数，用于版本比较 (110)

### Q5: APK 签名不一致怎么办？
**A**: 
- Debug 签名：`debug.keystore`
- Release 签名：需要使用正式密钥库
- 从 Debug 升级到 Release 需要卸载旧版

---

## 发布检查清单

发布前请核对以下内容:

- [ ] package.json 版本号已更新
- [ ] public/version.json 所有字段已更新
- [ ] android/app/build.gradle 版本号已更新
- [ ] changelog 清晰完整，格式正确
- [ ] APK 构建成功且体积合理
- [ ] APK 签名一致（同一用户升级需签名相同）
- [ ] GitHub Releases 已创建并上传文件
- [ ] downloadUrl 已更新到 public/version.json
- [ ] Git 提交已完成并推送到远程仓库
- [ ] 已在真机上完成功能测试

---

## 版本控制规范

遵循 [SemVer](https://semver.org/) 语义化版本规范:

```
主版本。次版本.修订号
(X.Y.Z)

示例：
1.0.0 - 初始发布
1.0.1 - 修复 Bug
1.1.0 - 新增向后兼容的功能
2.0.0 - 不兼容的 API 变更
```

---

## 自动化建议

未来可考虑的优化方向:

1. **CI/CD集成**: 使用 GitHub Actions 自动构建 APK
2. **版本对比**: 自动检测本地和远程版本差异
3. **差分更新**: 只对变化的文件进行更新
4. **后台下载**: 在 App 后台静默下载 APK
5. **更新统计**: 收集用户更新率数据

---

## 联系方式

如有问题，请联系:
- 项目负责人：@yourname
- Issue 反馈：https://github.com/shuatibao/app/issues

---

最后更新时间：2024-07-31
