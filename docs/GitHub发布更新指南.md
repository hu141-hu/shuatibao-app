# 刷题宝 · GitHub 发布更新指南（从零开始）

> 适用版本：v1.2.0 及以后。目标是让你把"检查更新 + 下载新版本 APK"这套功能真正跑起来。
> 更新机制说明：App 启动（或手动"检查更新"）时，会去 GitHub 上读取一个 `version.json`，
> 发现版本号比本地新就弹出更新提示；点"立即更新"会跳到 GitHub Release 页面下载新的 APK 安装包。

---

## 一、你需要准备的东西

1. 一个 GitHub 账号（免费）：[https://github.com/signup](https://github.com/signup)
2. 本机已安装 Git（检查：在 PowerShell 输入 `git --version`，有版本号即可）
3. 本机已安装 Java JDK 17 和 Android SDK（打包 APK 用，项目根目录 `BUILD_APK.md` 有详细说明）

---

## 二、在 GitHub 上创建仓库（1 分钟）

1. 登录 GitHub，点右上角 **+** → **New repository**
2. 填写：
   - **Repository name（仓库名）**：建议 `shuatibao-app`（纯英文，别用中文）
   - **Description**：可填 `刷题宝 PWA/Android 应用`
   - **Visibility**：必须选 **Public**（选 Private 的话，App 里的手机无法访问，更新会失败）
   - 其他保持默认，不要勾选"Add a README"等（我们本地已有文件）
3. 点 **Create repository**，创建完成

> 📌 记下你的"GitHub 用户名"和"仓库名"，后面所有地址都要用到。
> 本文以用户名 `yourname`、仓库名 `shuatibao-app` 为例，请全部替换成你自己的。

---

## 三、把本地项目推送到 GitHub

打开 PowerShell，进入项目目录：

```powershell
cd E:\qoderxm\题库
```

### 1. 初始化并提交（项目已初始化过 Git 的跳过第 1 步）

```powershell
git init
git config user.name "你的名字或昵称"
git config user.email "你的邮箱"
git add -A
git commit -m "feat: v1.2.0 优化（滑动手势/更新弹窗/离线缓存等）"
```

> ⚠️ 安全提醒：签名密钥 `android/app/app-release-key.jks` 和密码文件
> `android/keystore.properties` 已在 `.gitignore` 中排除，**不会被推送**。
> 请务必不要手动把它们加入 Git，否则仓库公开后任何人都能拿你的密钥签名假包。

### 2. 关联远程仓库并推送

```powershell
git remote add origin https://github.com/你的用户名/shuatibao-app.git
git branch -M main
git push -u origin main
```

刷新 GitHub 页面，应该能看到项目文件了。

> 如果提示需要登录，会弹出浏览器窗口，按提示授权即可（用"GitHub 网页方式"授权最省事）。

---

## 四、告诉 App"去哪里检查更新"

App 检查更新的地址在 **两处** 配置，任选一处改即可（推荐改第 1 处，简单直观）：

### 方式 1：直接改代码里的默认值（推荐，一劳永逸）

打开 `E:\qoderxm\题库\src\lib\updater.ts`，把文件顶部这两行：

```ts
const GITHUB_OWNER = 'shuatibao';      // TODO: 改成你的 GitHub 用户名
const GITHUB_REPO = 'app';             // TODO: 改成你的仓库名
```

改成：

```ts
const GITHUB_OWNER = 'yourname';       // ← 你的 GitHub 用户名
const GITHUB_REPO = 'shuatibao-app';   // ← 你的仓库名
```

这样 App 会自动检查以下两个地址（一个不通自动换另一个）：

- 主源（GitHub Raw）：`https://raw.githubusercontent.com/yourname/shuatibao-app/main/version.json`
- 备用源（jsDelivr 国内更稳）：`https://cdn.jsdelivr.net/gh/yourname/shuatibao-app@main/version.json`

### 方式 2：用环境变量（不推荐日常使用，仅作说明）

`.env.local` 里的 `NEXT_PUBLIC_VERSION_CHECK_URL` 会在构建时覆盖默认值；
但 `.env.local` 不会提交到 GitHub，所以换电脑/换人构建容易漏配。

---

## 五、打包 Release APK

在项目根目录运行（二选一）：

```powershell
# 方式 A：一键脚本（会检查环境并自动复制 APK 到 E:\qoderxm\lj\项目输出）
.\build-apk.bat

# 方式 B：手动分步
npm run build
npx cap sync
cd android
.\gradlew.bat assembleRelease
cd ..
```

产物位置：

- 已签名 APK：`android\app\build\outputs\apk\release\app-release.apk`

> 签名说明：项目已配置好签名（密钥库 `android/app/app-release-key.jks` + 密码文件
> `android/keystore.properties`）。**同一个密钥库签出来的包才能覆盖安装升级**，
> 请务必保管好这两个文件，并备份密钥库到安全的地方。

---

## 六、在 GitHub 上发布新版本（Release）

1. 打开你的仓库页面，右侧点 **Releases** → **Create a new release**（或 **Draft a new release**）
2. 填写：
   - **Choose a tag**：输入 `v1.2.0`（格式必须 `v + 版本号`），点 "Create new tag on publish"
   - **Target**：`main`
   - **Release title**：`v1.2.0 - 更新说明标题`
   - **Describe this release**：粘贴 `public\version.json` 里 changelog 的内容（中文即可）
3. 在 **Attach binaries** 区域把 `app-release.apk` 拖进去上传
4. 点 **Publish release**

### 获取 APK 下载地址

发布后，下载地址固定为：

```text
https://github.com/你的用户名/shuatibao-app/releases/download/v1.2.0/app-release.apk
```

> 注意：文件名必须是 `app-release.apk`（也就是上传时的文件名），否则地址对不上。

---

## 七、更新 version.json 里的下载地址并推送

打开 `E:\qoderxm\题库\public\version.json`，把 `downloadUrl` 改成上面这个地址：

```json
{
  "version": "1.2.0",
  "versionCode": 12,
  "downloadUrl": "https://github.com/你的用户名/shuatibao-app/releases/download/v1.2.0/app-release.apk",
  "changelog": "v1.2.0 (2026-08-02)\n\n新功能：\n- ...",
  "forceUpdate": false
}
```

然后提交推送：

```powershell
git add public/version.json
git commit -m "chore: 更新 v1.2.0 下载地址"
git push
```

> 每次发新版，三处版本号要一起改：`package.json`、`public/version.json`、
> `android/app/build.gradle`（versionCode/versionName）。另外 **public/sw.js 里的
> SW_VERSION 也要同步改成新的版本号**，否则手机上会一直用旧缓存页面。

---

## 八、验证（手机上测试）

1. 手机安装刚发布的 APK
2. 打开 App → 我的 → 检查更新
3. 应提示"当前已是最新版本"（因为刚装的就是最新版）
4. 再改一下 `public/version.json` 的 version 为 `1.2.1` 推送，重新在旧版 App 里点检查更新
5. 应弹出"发现新版本 v1.2.1"，点"立即更新"会打开浏览器开始下载 APK
6. 点"稍后提醒"应能正常关闭弹窗，且当天不再弹

---

## 九、常见问题

### Q1：GitHub 在国内访问慢/打不开，更新会失败吗？
App 的版本检查已内置两个源：GitHub Raw 失败会自动换 jsDelivr（国内一般能访问）。
如果 APK 下载慢，可以在 `downloadUrl` 里换成加速镜像地址（二选一，把整条 URL 替换）：

```text
# 方式 A：jsDelivr 代理 GitHub Release（文件名必须是 app-release.apk）
https://cdn.jsdelivr.net/gh/你的用户名/shuatibao-app@main/version.json

# 方式 B：ghproxy 类加速（社区免费服务，稳定性自行评估）
https://ghproxy.com/https://github.com/你的用户名/shuatibao-app/releases/download/v1.2.0/app-release.apk
```

### Q2：检查更新一直提示"当前已是最新版本"？
- 确认 `public/version.json` 已推送到 GitHub 的 `main` 分支
- 确认仓库是 **Public**
- 确认 `src/lib/updater.ts` 里的用户名/仓库名改对了
- 手机浏览器直接打开 raw 地址测试能否看到 JSON

### Q3：用户装了老版本，更新后页面还是旧的？
版本号变了但没改 `public/sw.js` 的 `SW_VERSION` 就会这样，按第七节最后一条提醒处理。

### Q4：换电脑后打不开 App / 签名不一致？
密钥库 `app-release-key.jks` 和 `keystore.properties` 要跟着项目走（存在安全位置），
否则新电脑打的包签名不同，旧用户无法覆盖安装。

---

## 十、自动化（可选进阶）

项目已附带 GitHub Actions 工作流 `.github/workflows/build-release.yml`：
以后你只需要打 Tag（如 `v1.2.1`）并推送，GitHub 就会自动构建 APK 并生成 Release，
无需本地打包。首次使用需在仓库 Settings → Secrets 里配置签名密钥（详见工作流文件注释）。

---

最后更新时间：2026-08-02
