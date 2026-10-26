# 发布 STYLE / ORBIT

这是一个**纯静态网站**：没有后端、数据库、环境变量，也不需要构建步骤。上传以下文件并给它们一个可访问的地址即可：

```text
dist/
├── index.html
├── styles.css
├── app.bundle.js
└── THIRD_PARTY_NOTICES.md
```

三件运行必需文件是 `index.html`、`styles.css`、`app.bundle.js`。所有示例图片都已经内联在 `app.bundle.js` 中，不需要额外的图片目录。

已经准备好的上传包：

- `style-orbit-site.zip`（约 1.3 MB，解压后就是上面的文件）

> 当前 `http://127.0.0.1:4173/` 只是这台电脑上的本地预览地址，不是公网地址。

---

## 方案 A：最快拿到公网地址（拖拽上传）

适合作品集、朋友访问、临时分享。**不需要服务器运维。**

### Netlify Drop

1. 打开 <https://app.netlify.com/drop>，登录或注册。
2. 把 `style-orbit-site.zip` 直接拖进页面，或拖入整个 `dist` 文件夹。
3. 等待部署完成，会得到一个 `https://xxxxx.netlify.app` 地址。
4. 在 Site configuration → General → Site details 里修改站点名。
5. 在 Domain management 里可以绑定自己的域名。

### Cloudflare Pages

1. 打开 <https://pages.cloudflare.com/> 并登录。
2. 选择 **Create a project → Direct Upload**。
3. 上传 `style-orbit-site.zip` 或 `dist`。
4. 部署完成后得到 `https://xxxxx.pages.dev`；可继续绑定自定义域名。

### Vercel

```bash
cd styleverse
npx vercel dist --prod
```

按提示登录后即可得到 `https://xxxxx.vercel.app`。

> 这三个平台部署快、自带 HTTPS，域名和 CDN 维护成本低；其中 Netlify / Vercel 的默认节点在海外。如果主要受众在中国大陆，建议继续看方案 C。

---

## 方案 B：用 GitHub Pages 免费托管

适合已经使用 GitHub、希望代码和网站放在一起的情况。

本仓库已提供 `.github/workflows/pages.yml`：推送到 `main` 后，会安装锁定依赖、构建网页，并仅发布网站所需文件。

1. 将项目源码推送到 GitHub 仓库 `MUBAI0102/styleverse`。
2. 进入 **Settings → Pages**，将 **Source** 设置为 **GitHub Actions**。
3. 在 **Actions → Deploy website to GitHub Pages** 查看部署结果；需要时可点击 **Run workflow** 手动部署。
4. 部署成功后访问：<https://mubai0102.github.io/styleverse/>。

后续修改源码后提交并推送到 `main` 即可更新网站。桌面版压缩包发布到 **Releases**，不放入 Git 历史。

项目使用相对资源路径与 `#/skill/...` 路由，支持 GitHub Pages 仓库子目录。

---

## 方案 C：部署到国内云（大陆访问更稳定）

常见的静态托管方式：

- **腾讯云 COS**：创建存储桶 → 开启「静态网站」→ 上传 `dist` 内容 → 将 `index.html` 设为默认首页 → 开启公有读 → 通过桶域名访问。
- **阿里云 OSS**：创建 Bucket → 基础设置中开启静态页面 → 上传文件 → 将 `index.html` 设为默认首页 → 开启公共读。
- **腾讯 EdgeOne Pages / 阿里云 ESA**：支持静态站点托管和 CDN 加速，可作为进阶方案。

上线大陆自定义域名通常需要：

1. 已备案的域名（购买大陆服务器/CDN 前需完成 ICP 备案）；
2. 绑定域名并完成 DNS 解析；
3. 配置 HTTPS 证书；
4. 将默认首页设置为 `index.html`。

如果只是发给少量朋友测试，可以先用平台提供的默认测试域名，再决定是否买域名和备案。

### 自定义域名（所有平台通用）

1. 在域名服务商处添加 DNS 记录：
   - `www` 或根域名 CNAME 到托管平台提供的域名；
   - 或按平台提示添加 A / ALIAS 记录。
2. 在托管平台后台添加自定义域名；
3. 等待平台自动签发 HTTPS 证书（通常几分钟）。

---

## 发布前检查

- 页面的示例图片和 Skill / Prompt 内容来自 **Wibi Style** 与 8 位抖音创作者，视觉内容授权为**个人非商业使用**；公开分享请保留页面中的作者署名和来源链接。商业用途需先取得相应原作者许可，见 `THIRD_PARTY_NOTICES.md`。
- 不需要任何 API Key、后端地址或环境变量。
- 路由使用 `#/skill/...` 哈希路由，静态托管不需要配置 SPA rewrite / fallback。
- 上线后按 `Ctrl + F5` 强刷验证一次：
  - 拖动旋转、滚轮缩放；
  - 悬停出现标签；
  - 点击照片打开详情；
  - 手机端触屏轻点打开详情；
  - 「技能目录」的筛选和搜索；
  - 「操作指南」弹窗。

## 本地发布前预览

```bash
cd styleverse
python -m http.server 4173 --directory dist
```

然后打开 <http://127.0.0.1:4173/>。
