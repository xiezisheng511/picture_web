# PicEdit Web — 技术架构文档

## 1. 技术选型

| 层级 | 选型 | 理由 |
|------|------|------|
| 构建工具 | Vite | 快速冷启动、ESM 原生、构建产物小 |
| UI 框架 | React 18 + TypeScript | 生态成熟、组件化、类型安全 |
| 路由 | React Router v6 | 标准 SPA 路由方案 |
| 样式 | TailwindCSS | 快速搭建现代风格、零运行时 |
| 状态管理 | Zustand | 轻量、无样板代码 |
| 国际化 | i18next + react-i18next | 成熟、SSR 友好 |
| 图像处理 | Canvas API + 自实现算法 | 纯前端、零依赖 |
| AI 抠图（可选） | remove.bg API / Replicate | 第三方 API，浏览器直调 |
| 测试 | Vitest + @testing-library/react | 与 Vite 集成最好 |
| 部署 | Vercel / Netlify / Cloudflare Pages | 免费 HTTPS、全球 CDN |
| 域名 + DNS | Cloudflare | 免费 SSL、防盗链 |

## 2. 目录结构

```
picture_web/
├── public/                 # 静态资源
│   ├── favicon.svg
│   ├── robots.txt
│   └── ads.txt             # AdSense 卖家声明
├── src/
│   ├── main.tsx            # 入口
│   ├── App.tsx             # 路由根
│   ├── routes/             # 页面级组件
│   │   ├── Home.tsx
│   │   ├── BgColor.tsx
│   │   ├── RemoveWatermark.tsx
│   │   ├── Edit.tsx
│   │   ├── AiCutout.tsx
│   │   ├── About.tsx
│   │   ├── Privacy.tsx
│   │   └── Terms.tsx
│   ├── components/         # 复用组件
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── AdSlot.tsx
│   │   ├── ui/             # 基础组件 (Button/Card/Input)
│   │   ├── tool/
│   │   │   ├── ImageUploader.tsx
│   │   │   ├── ImagePreview.tsx
│   │   │   ├── ColorPicker.tsx
│   │   │   └── DownloadButton.tsx
│   ├── lib/                # 核心算法 / 工具库
│   │   ├── image/
│   │   │   ├── bgColor.ts          # 换背景
│   │   │   ├── watermark.ts        # 去水印
│   │   │   ├── edit.ts             # 裁剪/缩放/旋转/压缩
│   │   │   ├── aiCutout.ts         # AI API 封装
│   │   │   └── canvas.ts           # Canvas 工具函数
│   │   ├── format.ts               # 文件类型、字节大小格式化
│   │   └── download.ts             # 触发浏览器下载
│   ├── i18n/
│   │   ├── index.ts
│   │   ├── zh.json
│   │   └── en.json
│   ├── store/              # Zustand store
│   │   └── useImageStore.ts
│   ├── styles/
│   │   └── globals.css
│   └── types/
│       └── index.ts
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## 3. 核心算法方案

### 3.1 换背景颜色
**算法 A（前端纯算法，速度快）**：
1. 用户上传图片，Canvas 加载像素。
2. 用户选择目标颜色（默认白/红/蓝）。
3. 简单方案：取边角像素作为背景色 → 用颜色距离（Lab 空间）做 Mask → 替换为目标色。
4. 进阶：基于 GrabCut 风格的前景点检测。

**算法 B（AI 高精度，可选）**：
- 调 remove.bg API 获取前景 Mask → 合成新背景。

### 3.2 去水印
1. 用户在图上框选水印区域（矩形）。
2. 使用 Inpainting 算法：
   - 简单版：取周围像素平均值填充。
   - 进阶版：Fast Marching Method / Navier-Stokes 实现。
3. 输出修复结果。

### 3.3 基础编辑
- 裁剪：Canvas 裁剪区域。
- 缩放：Canvas drawImage + 双线性插值。
- 旋转：Canvas translate + rotate。
- 压缩：降低 quality（toBlob('image/jpeg', 0.8)）。
- 格式转换：canvas.toBlob('image/png' | 'image/webp')。

### 3.4 AI 抠图
- 默认走 remove.bg：POST multipart/form-data 到 `https://api.remove.bg/v1.0/removebg`。
- 返回 PNG（透明背景）→ 合成新底色。
- API Key 通过 `.env` 配置，前端运行时调用（仅适合 demo；生产建议走后端代理以保护 Key）。

## 4. i18n 方案

- 默认语言：浏览器 `navigator.language` → 命中 `zh` 用中文，否则英文。
- 用户切换后写入 `localStorage`（注意：artifact 不支持 localStorage，常规 web 项目可用）。
- 文案统一在 `src/i18n/zh.json` 和 `en.json`。
- 组件内通过 `useTranslation()` hook 使用。

## 5. AdSense 接入流程

1. 域名解析到 Cloudflare，启用 HTTPS。
2. 站点部署到 Vercel/Netlify。
3. 在 Google AdSense 申请账号，添加站点。
4. 验证站点（添加 ads.txt + meta 验证代码）。
5. 审核通过后，在 `AdSlot.tsx` 组件粘贴广告代码。
6. 预留 4 个广告位：top、sidebar、result、footer。

## 6. 性能优化

- 图片懒加载（loading="lazy"）。
- 大图上传前用 createImageBitmap + 缩放到 max 2048px 长边。
- Web Worker 处理耗时算法（避免阻塞主线程）。
- 路由级代码分割（React.lazy）。

## 7. 安全与隐私

- 所有图像处理默认在浏览器端，文件不上传服务器（核心卖点）。
- AI 抠图需用户主动选择，文件上传至 remove.bg。
- 提供隐私政策页面，明确说明数据流。
- CSP 头限制脚本来源。