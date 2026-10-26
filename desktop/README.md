# STYLE / ORBIT Desktop

Windows 便携桌面版，基于现有 Three.js 画廊和 Electron 45 运行时。

## 直接使用

```text
desktop/dist/STYLE-ORBIT/STYLE-ORBIT.exe
desktop/dist/STYLE-ORBIT-windows-x64.zip
```

先把整个 zip **右键 → 全部解压**，再打开解压出来的 `STYLE-ORBIT` 文件夹双击
`STYLE-ORBIT.exe`。不要从压缩包预览里直接运行，也不要只把 exe 单独拖出来；
它需要同目录的 `runtime` 文件夹。

根目录的 `STYLE-ORBIT.exe` 是启动器；真正的 Electron 主程序在
`runtime\STYLE-ORBIT-core.exe`。因为部分 Windows 环境会在 Chromium 沙箱初始化时
以 `0x80000003` 崩溃，启动器会固定追加 `--no-sandbox --enable-unsafe-swiftshader`
再启动主程序。不要手动运行 `STYLE-ORBIT-core.exe`。

如果双击没反应：

1. 右键 `STYLE-ORBIT.exe` → 属性 → 解除锁定；或 SmartScreen 里选择
   “更多信息 → 仍要运行”。
2. 检查杀毒软件是否拦截了未签名的 Electron 应用。
3. 双击 `Diagnose-Start.cmd`，它会用软件渲染并显示退出码；启动日志在
   `%APPDATA%\STYLE ORBIT\startup.log`。

双击 `STYLE-ORBIT.exe`。本地库默认写入：

```text
%APPDATA%\STYLE ORBIT\library.json
```

「添加」面板里的「打开数据文件夹」可直接定位；关闭软件后复制 `library.json` 即可备份全部本地 Skill / Prompt、封面和提示词。

## 功能

- 本地添加 Skill / Prompt；Prompt 必须填写完整提示词。
- 中文名、英文名、提示词全文与现有全部条目精确比对，命中即阻止保存。
- 名称 / 提示词相似时显示已有条目的相似度，必须勾选确认才能继续。
- slug 与内置或已有本地条目冲突时自动追加后缀。
- 支持 PNG / JPG / WebP 封面，客户端压缩后写入本地库；不选择图片时生成品牌占位封面。
- 本地条目的详情页可编辑、删除；保存后自动刷新 3D 轨道。
- 目录新增「本地」筛选和 `LOCAL` / `LOCAL PROMPT` 标识。

## 开发运行

在 `styleverse/` 根目录完成 web 构建：

```bash
npm run build
```

把 `index.html`、`styles.css`、`app.bundle.js` 复制到 `desktop/app/ui/`，然后运行：

```powershell
# 移除 DSH 环境里的 ELECTRON_RUN_AS_NODE，再运行 Electron
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
.\desktop\runtime\electron.exe .\desktop\app
```

源码仓库不包含 Electron 运行时。请从 [Electron v45.0.0](https://github.com/electron/electron/releases/download/v45.0.0/electron-v45.0.0-win32-x64.zip) 下载 Windows x64 压缩包并解压到 `desktop/runtime`，确认 `desktop/runtime/electron.exe` 存在。可直接使用的便携软件请从 [Releases](https://github.com/MUBAI0102/styleverse/releases/latest) 下载。

## 打包

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\desktop\build-desktop.ps1
```

脚本会：

1. 从根目录复制最新 web 产物到 `app/ui`；
2. 复制 `runtime` 到 `dist/STYLE-ORBIT`；
3. 把 `electron.exe` 重命名为 `STYLE-ORBIT.exe`；
4. 把应用包安装到 `resources/app`；
5. 写入 `README.txt` 与 `THIRD_PARTY_NOTICES.md`；
6. 生成 `STYLE-ORBIT-windows-x64.zip`。

## 架构

- `app/main.js`：Electron 主进程、单实例锁、窗口、本地 JSON 读写、外部链接。
- `app/preload.js`：通过 `contextBridge` 暴露只读初始库、保存、数据目录、打开目录。
- `app/ui/`：现有静态站点的构建副本。
- `src/custom-library.js`（在 `styleverse/src/`）：本地条目清洗、slug、相似度、图片压缩。
- 本地数据格式：

```json
{
  "schemaVersion": 1,
  "updatedAt": "…",
  "items": [
    {
      "customId": "local-…",
      "kind": "skill",
      "zh": "…",
      "en": "…",
      "slug": "…",
      "cat": "scene",
      "prompt": "…",
      "image": "data:image/webp;base64,…"
    }
  ]
}
```

## 注意

- 构建产物是**未签名**便携应用；Windows SmartScreen 可能提示未知发布者。正式分发建议使用代码签名证书。
- 本地库图片为 data URL，库文件会随封面数量增长。单张图片会压缩到最长边 1200px、WebP 质量 0.84。
- `app` 入口使用目录形式而非 asar，便于本地修复；如需发布级封装可再改为 asar。
- 内置示例、第三方 Skill 名与抖音提示词版权归各原作者所有；桌面版新增的本地内容由用户自行负责。
