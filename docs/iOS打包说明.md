# iOS 打包说明

## 先说结论

**iOS 版本无法在 Windows 上编译出可安装的包。** 苹果的工具链（Xcode、codesign）只跑在 macOS 上，这是系统限制，不是配置问题。

所以这个仓库的做法是：

| 交付物 | 在哪 | 能干什么 |
|---|---|---|
| iOS Xcode 工程 | `ios/` | 拿到 Mac 上直接打开、真机调试、归档上架 |
| 未签名 .ipa | GitHub Actions 的 artifact | 用 Sideloadly / AltStore 自签后装到手机上 |
| App Store 包 | 需要 Mac + 开发者账号 | 走 TestFlight / 正式发布 |

---

## 一、已经配好的部分

`ios/` 下的工程已经按 Android 版对齐：

- Bundle ID：`com.shuatibao.app`（与 Android 一致）
- 显示名称：刷题宝
- 版本号：`1.4.3` / build `20`（与 `public/version.json` 同步）
- 图标：1024×1024 满版（iOS 会自己切圆角，所以图标本身不能有圆角和透明）
- 启动图：2732×2732 白底居中图标
- 方向：iPhone 仅竖屏
- `ITSAppUsesNonExemptEncryption = false`（免去每次上传的出口合规问答）
- 依赖管理：Swift Package Manager（Capacitor 8 默认，不需要 CocoaPods）

---

## 二、在 Mac 上跑起来

```bash
# 1. 装依赖
npm ci

# 2. 构建前端（必须，ios 里不带前端源码）
npm run build

# 3. 把前端产物同步进 Xcode 工程
npx cap sync ios

# 4. 打开工程
npx cap open ios
```

在 Xcode 里：

1. 选中左侧 `App` 工程 → `Signing & Capabilities`
2. `Team` 选你的 Apple ID（免费账号也能真机调试，只是证书 7 天过期）
3. `Bundle Identifier` 如果和别人的账号冲突，改成 `com.你的名字.shuatibao`
4. 连上 iPhone，选中设备，点 Run

> 免费 Apple ID 的限制：一次最多 3 个 App、证书 7 天有效、不能上架。
> 上架需要 Apple Developer Program（$99/年）。

---

## 三、用 GitHub Actions 出未签名 ipa

推一个 `v*` 标签就会自动构建（也可以去 Actions 页面手动触发）：

```bash
git tag v1.4.3
git push origin v1.4.3
```

构建完成后，在 Actions → Build iOS App → 该次运行 → Artifacts 里下载 `shuatibao-ios-unsigned`。

### 怎么把它装到 iPhone 上

未签名的 ipa 不能直接安装，需要用一个自己的 Apple ID 重新签名：

1. 电脑装 [Sideloadly](https://sideloadly.io/)（Windows 也能用）
2. 手机连电脑，把 ipa 拖进 Sideloadly
3. 填你的 Apple ID，点 Start
4. 手机上到「设置 → 通用 → VPN与设备管理」信任一下证书

注意：免费账号签的 App **7 天后会失效**，需要重新签一次。

---

## 四、如果要正式上架

1. 加入 Apple Developer Program
2. 在 Xcode 里配置正式证书与描述文件，`Product → Archive`
3. Organizer 里 `Distribute App → App Store Connect`
4. 在 App Store Connect 填元数据、截图、隐私说明，提交审核

审核时注意：

- **隐私政策**：App 会读取本地文件（导入题库）、使用网络（AI 讲解）。需要提供隐私政策链接。
- **AI 内容**：如果保留 AI 讲解功能，审核可能要求说明内容来源与免责声明。
- **账号体系**：当前版本没有登录，不涉及「必须提供账号删除入口」的问题。
- **课程/题库类**：如果题库内容来自第三方教材，注意版权声明。

---

## 五、和 Android 的差异

| 项目 | Android | iOS |
|---|---|---|
| 在线更新 | 检测 `version.json` + GitHub Release，App 内下载安装 | ❌ 不允许，必须走 App Store |
| 返回键 | 硬件返回键，已做逐级返回 | 无硬件返回键，靠系统手势 / 页面内返回按钮 |
| 包格式 | apk | ipa（未签名需自签） |
| 分发 | 直接装 apk | TestFlight 或 App Store |

因此 `src/lib/updater.ts` 的更新检查在 iOS 上意义不大——它最多能提示「有新版本」，但没法自己装。如果以后要上架，建议在 iOS 上把更新提示关掉。

---

## 六、常见问题

**Q：`npx cap sync ios` 报 "pod install" 失败？**
Capacitor 8 默认用 SPM，不该出现。如果出现了，说明项目里有残留的 `Podfile`，删掉再同步。

**Q：Xcode 报 "No such module 'CapacitorApp'"？**
SPM 依赖没解析。`File → Packages → Resolve Package Versions`。

**Q：真机运行白屏？**
先确认 `npm run build` 和 `npx cap sync ios` 都执行过。iOS 端的资源路径与 Android 一致，`trailingSlash` 已开启，`profile/index.html` 这类目录式路由是正常的。

**Q：能不能不上架，只给自己用？**
可以。Sideloadly 自签，或者用 TestFlight（需要开发者账号，但可以给 100 台设备测试）。
