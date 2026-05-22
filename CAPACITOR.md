# 她健康 · Capacitor 原生 App

用 [Capacitor](https://capacitorjs.com/) 把现有 Next.js 包成 Android / iOS App。  
App 内 WebView **加载已部署的 HTTPS 站点**（保留 `/api/ai-chat`、Supabase 等能力），不是纯离线静态包。

## 架构

```
┌─────────────────┐      HTTPS       ┌──────────────────────┐
│  Android / iOS  │  ──────────────► │  Next.js (Vercel 等) │
│  Capacitor 壳   │                  │  + API Routes        │
└─────────────────┘                  └──────────────────────┘
```

## 1. 部署 Web 端（必做）

1. 把仓库推到 GitHub（已完成）
2. 在 [Vercel](https://vercel.com) 导入项目并部署
3. 在 Vercel 环境变量里配置（与 `.env.local` 相同）：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `AI_PROVIDER` / `DEEPSEEK_API_KEY` 等
4. 生产域名：**https://www.shealth.asia**（Vercel + 阿里云 DNS）

默认已指向该地址；如需覆盖，复制 `.env.capacitor.example` 为 `.env.capacitor.local`。

## 2. 配置 App 加载地址

复制示例并填入你的地址：

```powershell
copy .env.capacitor.example .env.capacitor.local
```

编辑 `.env.capacitor.local`（可选，默认已是生产域名）：

```env
CAPACITOR_SERVER_URL=https://www.shealth.asia
```

**本地真机调试**（电脑与手机同一 WiFi，且 `npm run dev` 已启动）：

```env
CAPACITOR_SERVER_URL=http://192.168.5.11:3000
```

并在 `next.config.mjs` 的 `allowedDevOrigins` 里包含该 IP。

## 3. 同步原生工程

```powershell
npm run cap:sync
```

首次需添加平台（只需一次）：

```powershell
npx cap add android
npx cap add ios   # 需要 macOS + Xcode
npm run cap:sync
```

## 4. Android 打包

**前置：** 安装 [Android Studio](https://developer.android.com/studio) 与 Android SDK。

```powershell
npm run cap:android
```

在 Android Studio 中：

1. 等待 Gradle 同步完成
2. 连接真机或启动模拟器
3. Run ▶ 安装调试包  
4. 发布：`Build` → `Generate Signed Bundle / APK` → 选 **AAB** 上传 Google Play

## 5. iOS 打包（需 Mac）

```powershell
npm run cap:ios
```

在 Xcode 中配置 Signing → Archive → 上传 App Store Connect。  
需要 Apple Developer 账号（约 $99/年）。

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run cap:sync` | 同步 web 资源与插件到 android/ios |
| `npm run cap:android` | 用 Android Studio 打开工程 |
| `npm run cap:ios` | 用 Xcode 打开工程 |
| `npm run cap:run:android` | CLI 直接跑 Android（需设备/模拟器） |

## 修改 App 信息后重新同步

改 `capacitor.config.ts` 里的 `appId` / `appName` 后执行 `npm run cap:sync`。

## 注意事项

- **不要**把 `DEEPSEEK_API_KEY` 写进 App 壳里，密钥只放在 Vercel 服务端
- 生产环境务必使用 **HTTPS**
- 改 UI 后：部署 Vercel → App 无需重装，刷新即可（加载远程 URL）
- 改 Capacitor 插件或 `appId` 后：需 `cap:sync` 并重新打包

## 应用图标

将 1024×1024 图标放入：

- Android：`android/app/src/main/res/`（各密度 mipmap，可用 Android Studio Image Asset）
- iOS：`ios/App/App/Assets.xcassets/AppIcon.appiconset/`

或使用 `@capacitor/assets` 一键生成（可选）。
