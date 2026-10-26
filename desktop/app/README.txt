STYLE / ORBIT — Windows 便携版
================================

## 第一次运行（重要）

1. 右键下载到的 zip → “全部解压 / Extract All”。
2. 打开解压出来的 STYLE-ORBIT 文件夹。
3. 确认该文件夹里同时有：
   STYLE-ORBIT.exe
   runtime 文件夹
   Diagnose-Start.cmd
4. 双击 STYLE-ORBIT.exe。

不要在压缩包的预览窗口里直接双击 exe；只把 STYLE-ORBIT.exe 单独拖出来也
无法运行，因为它依赖同目录下的 runtime 文件夹。runtime 里是内部主程序和运行库，
不需要手动运行。

## 如果双击没反应

A. Windows SmartScreen
   右键 STYLE-ORBIT.exe → 属性 → 勾选“解除锁定” → 确定。
   或在提示窗口选择“更多信息 → 仍要运行”。

B. 杀毒软件/安全软件
   检查是否拦截或隔离了 STYLE-ORBIT.exe；将整个解压文件夹加入信任。

C. 仍然无法启动
   双击本目录下的 Diagnose-Start.cmd。
   它会用软件渲染并打开日志启动；不要关闭黑色命令行窗口。
   如果仍无窗口，把命令行里最后的文字发回，或查看：
   %APPDATA%\STYLE ORBIT\startup.log

## 本地库

自定义 Skill / Prompt、封面和提示词保存在：
  %APPDATA%\STYLE ORBIT\library.json
软件里的「添加 → 打开数据文件夹」可以直接打开。
关闭软件后复制 library.json 即可备份全部本地条目及图片。

## 功能

- 顶部「添加」：新增 Skill / Prompt，可上传封面
- 自动检查中文名、英文名、提示词全文是否重复；相似名称会提示确认
- 详情页底部可编辑 / 删除本地条目
- 支持 GitHub / 抖音 / 本地来源筛选
- 完全离线，不上传本地库或图片

## 版权

内置示例和提示词版权归各原作者所有，详见 THIRD_PARTY_NOTICES.md。
软件按个人、非商业展示用途交付；商业使用请先取得相应授权。
