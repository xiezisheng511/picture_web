# PicEdit Web — UI 设计规范

## 1. 设计原则

- **现代简约**：大面积留白，柔和配色，专注于内容（图片）。
- **易用性优先**：操作流程不超过 3 步；按钮文案动词化。
- **隐私信任感**：突出"不上传服务器"标识，建立用户信任。
- **广告友好**：内容与广告自然分区，不影响工具可用性。

## 2. 色彩系统

### 主色板
| 角色 | 颜色 | 用途 |
|------|------|------|
| Primary | `#6366F1`（Indigo 500） | 主按钮、链接、强调 |
| Primary Hover | `#4F46E5` | 按钮悬停 |
| Accent | `#10B981`（Emerald 500） | 成功状态、上传提示 |
| Danger | `#EF4444` | 错误、删除 |

### 中性色
| 角色 | 颜色 |
|------|------|
| Background | `#FFFFFF` |
| Surface | `#F9FAFB` |
| Border | `#E5E7EB` |
| Text Primary | `#111827` |
| Text Secondary | `#6B7280` |
| Text Muted | `#9CA3AF` |

### 深色模式（可选 v2）
- Background: `#0F172A`
- Surface: `#1E293B`
- Text Primary: `#F1F5F9`

## 3. 字体

- **中文**：PingFang SC, Microsoft YaHei, sans-serif
- **英文**：Inter, system-ui, -apple-system, sans-serif
- 标题字号：48 / 36 / 24 px
- 正文：16 px（行高 1.6）
- 小字：14 px

## 4. 间距系统（8px 基准）

- `space-1` = 4px
- `space-2` = 8px
- `space-4` = 16px
- `space-6` = 24px
- `space-8` = 32px
- `space-12` = 48px
- `space-16` = 64px

## 5. 圆角与阴影

- 圆角：组件 `8px`，卡片 `12px`，按钮 `8px`，上传区 `16px`
- 阴影：
  - `shadow-sm`：卡片默认
  - `shadow-md`：卡片悬停
  - `shadow-lg`：模态框

## 6. 组件规范

### Button
- Primary：背景 Indigo 500，白字，圆角 8px，padding 12px 24px
- Secondary：白底，灰边，主色字
- Ghost：无边框，hover 浅灰背景

### Card（工具卡片）
- 白底，圆角 12px，padding 24px
- 顶部图标 48px
- 标题 20px Bold，描述 14px 灰
- 悬停：阴影加深、上移 2px

### Upload Zone
- 虚线边框 2px，灰边，圆角 16px
- 中心：图标 + 主文案 + 副文案
- Hover：边框变主色，背景浅色

### Image Preview
- 居中显示，背景网格（透明图检查）
- 左右对比模式：滑块拖动

### Ad Slot
- 浅灰背景 + 占位文案 "Advertisement"（AdSense 通过前）
- 通过后用真实广告代码替换

## 7. 响应式断点

- Mobile：< 640px（单列）
- Tablet：640-1024px（双列）
- Desktop：> 1024px（多列 + 侧栏）

## 8. 微交互

- 按钮 hover：scale(1.02) + 阴影过渡 200ms
- 图片处理进度：进度条 + "正在处理..."
- 结果出现：fade-in 300ms
- 错误提示：toast 从顶部滑入

## 9. 内容文案风格

- 简洁、动词开头
- 双语并列：例如"换底色 / Change Background"
- 强调隐私："🔒 图片不上传服务器 / 🔒 Files never leave your device"