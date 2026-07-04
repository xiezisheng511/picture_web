# 部署 & AdSense 接入指南

## 目录

1. [本地开发](#本地开发)
2. [部署到生产](#部署到生产)
   - [Vercel（推荐）](#vercel推荐)
   - [Netlify](#netlify)
   - [Cloudflare Pages](#cloudflare-pages)
3. [域名与 HTTPS](#域名与-https)
4. [Google AdSense 接入](#google-adsense-接入)
5. [上线前检查清单](#上线前检查清单)

---

## 本地开发

```bash
npm install
npm run dev
```

开发服务器默认运行在 `http://localhost:5173`。

## 部署到生产

### Vercel（推荐）

Vercel 对 Vite 项目有原生支持，零配置部署。

1. **准备代码**：将项目推送到 GitHub / GitLab / Bitbucket。
2. **导入 Vercel**：
   - 登录 [vercel.com](https://vercel.com)，点击 "New Project"。
   - 选择你的 Git 仓库，点击 "Import"。
3. **配置**：
   - Framework Preset: **Vite**（自动识别）
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **部署**：点击 "Deploy"，等待 1-2 分钟。
5. **后续**：每次 push 到主分支自动触发部署。

环境变量：暂无需配置（API Key 通过 `localStorage` 设置）。

### Netlify

1. 登录 [netlify.com](https://netlify.com)，"Add new site" → "Import an existing project"。
2. 连接 Git 仓库。
3. 配置：
   - Build command: `npm run build`
   - Publish directory: `dist`
4. 部署。

### Cloudflare Pages

1. 登录 [pages.cloudflare.com](https://pages.cloudflare.com)。
2. "Create a project" → "Connect to Git"。
3. 配置：
   - Build command: `npm run build`
   - Build output directory: `dist`
4. 部署。Cloudflare 的 CDN 速度对中文站点也很友好。

## 域名与 HTTPS

### 选项 A：在域名注册商（阿里云 / 腾讯云 / Namecheap）购买域名

1. 在 Cloudflare 添加站点（免费计划）。
2. 将域名的 NS 记录改为 Cloudflare 提供。
3. 在 Cloudflare 添加 CNAME 记录指向你的部署域名（如 `picedit.vercel.app`）。
4. Cloudflare 自动签发 SSL 证书。

### 选项 B：直接在 Vercel / Netlify 购买域名

更简单：直接在部署平台购买和管理域名，HTTPS 自动配置。

## Google AdSense 接入

### 步骤 1：申请 AdSense 账号

1. 访问 [google.com/adsense](https://www.google.com/adsense)。
2. 使用 Google 账号登录。
3. 添加你的站点 URL。
4. 选择国家/地区、付款方式。

### 步骤 2：站点验证

AdSense 提供两种验证方式：

**方式 A：HTML 文件验证**
- 下载 Google 提供的 `ads.txt` 或验证文件。
- 放到 `public/` 目录，重新部署。

**方式 B：`<meta>` 标签**
- 在 `index.html` 的 `<head>` 添加 Google 提供的 meta 标签。

本项目已在 `public/ads.txt` 预留位置。审核通过后，把你的 publisher ID 替换占位符：

```txt
google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```

替换 `pub-XXXXXXXXXXXXXXXX` 为你的真实 ID（AdSense 后台可见）。

### 步骤 3：等待审核

- AdSense 审核通常需要 **1-2 周**。
- 站点必须有 **足够原创内容**（每个工具页面的 SEO 文案就是为此设计）。
- 必须有 **隐私政策** 和 **服务条款** 页面（已提供）。
- 必须有 **联系方式**（About 页面已提供）。

### 步骤 4：插入广告代码

审核通过后，在 AdSense 后台创建广告单元，会得到类似这样的代码：

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
        crossorigin="anonymous"></script>
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
     data-ad-slot="YYYYYYYYYY"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
```

#### 4a. 加载 AdSense 脚本

在 `index.html` 的 `<head>` 末尾添加：

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
        crossorigin="anonymous"></script>
```

#### 4b. 替换广告位占位符

打开 `src/components/layout/AdSlot.tsx`，把 `aria-label` 下方的占位 div 替换为上面的 `<ins>` 代码（每个尺寸各对应一个广告单元）。

`AdSlot` 组件定义了三个尺寸：

| size | 推荐尺寸 | 用途 |
|------|---------|------|
| `banner` | 728x90 / 响应式 | 顶部横幅、页脚 |
| `sidebar` | 300x250 | 侧边栏 |
| `inline` | 自适应 | 文章流中 |

#### 4c. 修改 `TopBannerAd.tsx`

把占位的 `<AdSlot size="banner" />` 替换为实际广告代码（或保留组件方式）。

### 步骤 5：监控收入

AdSense 后台 → 报告页面查看实时收入、CTR、CPC。

**最佳实践**：
- 不要点击自己的广告（违反 AdSense 政策）。
- 不要诱导用户点击（"点击支持我们"之类的话术禁止）。
- 广告与内容要明显区分。
- 移动端体验同样重要。

## 上线前检查清单

- [ ] 替换 `public/ads.txt` 中的 publisher ID 占位符
- [ ] 更新 `index.html` 的 `<title>` 和 `<meta>` 描述为你最终的站点
- [ ] 测试所有 4 个工具在 Chrome / Firefox / Safari / 移动端的表现
- [ ] 验证中英文案显示正确
- [ ] 添加站点 favicon（已是 SVG）
- [ ] 配置 CSP（可选，参考下方）

### 推荐 CSP 头

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; img-src 'self' data: blob: https:; script-src 'self' https://pagead2.googlesyndication.com https://www.googletagservices.com 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://api.remove.bg;">
```

部署到 Vercel 后可在 `vercel.json` 配置：

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; img-src 'self' data: blob: https:; script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://www.googletagservices.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.remove.bg;"
        }
      ]
    }
  ]
}
```

## 常见问题

**Q：审核被拒怎么办？**
A：常见原因：站点内容太少、缺少必要页面、域名刚解析不久。建议：上线后等待 2-4 周、确保每个工具页面有 300+ 字原创内容、添加博客或关于页面。

**Q：如何加速审核？**
A：保持稳定更新频率（每周至少 1-2 次 commit），增加原创工具页面（如各工具的详细教程页），提交审核前确保所有链接可用。

**Q：AI 抠图 API Key 安全吗？**
A：浏览器端调用会暴露 Key。本项目为 demo，**生产建议走后端代理**（如 Cloudflare Worker）。后续可扩展。

**Q：图片处理速度慢？**
A：大图（>2048px）会自动缩放。如需更高质量，可在 `canvas.ts` 中调整 `max` 常量。耗时算法后续可迁到 Web Worker。