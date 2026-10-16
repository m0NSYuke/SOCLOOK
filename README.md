# SOCLOOK

m0NSYuke 的全球观察站。目标是独立的 **公开 GitHub 源码仓库 + 公开网站 + 每周自动采集**，不修改已有个人主页。

## 本地运行与检查

需要 Node.js 22.13+、Python 3.11+。

```sh
npm ci --ignore-scripts
npm run check
npm run validate
python -m unittest discover -s scripts -p 'test_*.py'
npm run collect
npm run build
```

静态网站输出到 `pages-dist/`。笔记、收藏、关注企业只保存在访问者当前浏览器，不上传；清除浏览器数据后不会自动恢复。网站内容公开，不需要登录。

## 每周自动更新

`.github/workflows/weekly.yml` 在北京时间每周六 08:35 启动采集，也支持 Actions 中手动运行。GitHub 可能延迟执行；09:00 是原有正式周报的目标时间，不是托管方的准时保证。工作流必须在默认分支 main。

1. 从 `config/sources.json` 抓取官方 RSS/Atom，按北京时间筛选、去重，仅保存标题、链接和时间。
2. 保留 `data/collections/` 每次采集档案及 `data/latest.json`。同日重试覆盖同一日期快照，不增加重复记录。
3. 校验正式周报历史，构建页面；启用 Pages 后直接部署同一次运行的产物。
4. 网站“每周自动采集”显示最近采集日期、来源失败和覆盖缺口。全部来源失败则工作流失败，保留旧站，不伪装成功；部分失败会明确显示。

**采集候选不等于完成研究。** 国内产业、具身智能、VLA/WAM、投资/创业/成长等研究任务保留在配置与 UPDATE_GUIDE.md 中，仍需研究流程阅读原文、核验并编辑正式周报。脚本不会抓取 Codex 聊天、读取本地自动任务或把 RSS 自动改写成结论；它无需模型 API key。

## GitHub 上线

公开源码仓库：https://github.com/m0NSYuke/SOCLOOK

公开网站：https://m0nsyuke.github.io/SOCLOOK/

2026-10-16 已完成首次云端采集、构建与 Pages 发布，线上首页、JS/CSS、候选清单及周报档案读回通过。

先完成 `gh auth login --hostname github.com --git-protocol https --web`，使用预期的 GitHub 账号。只将本目录作为独立仓库上传，不上传工作区其他旧副本、Sites 身份、数据库、个人笔记或凭据。

使用公开仓库 SOCLOOK，默认分支 main。GitHub 仓库 Settings → Pages → Build and deployment 已选择 GitHub Actions；Actions repository variable `PAGES_ENABLED` 已设为 `true`。再次手动运行本工作流，在 deploy 作业成功后读取其实际网址并验证。

用户于 2026-10-16 明确选择源码与网站全部公开。所有已提交文件及其 Git 历史都可公开读取；前端与构建产物不得包含秘密或个人记录。

GitHub Pages 为当前主入口；原 Sites 保留原样，不再作为每周发布目标。正式周报导入和研究标准见 UPDATE_GUIDE.md。
