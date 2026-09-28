# JobFlow v0.1.0

JobFlow v0.1.0 是第一个可安装的 V1 版本，面向个人秋招 / 校招投递管理，采用本地优先架构。

## Highlights

- **Applications Pipeline**：快速新增公司 / 岗位，支持 List 与 Kanban 两种视图、优先级、状态、当前节点、下一步行动与截止日期。
- **Timeline**：岗位状态、节点、面试等关键变化自动写入 Timeline，便于回顾完整求职过程。
- **Interview Center**：记录面试轮次、时间、形式、结果，并维护主要问题、算法题、项目追问、自评和后续改进。
- **Today Dashboard**：聚合当天面试、Next Action、逾期事项与最近事件。
- **Analytics**：提供投递漏斗、状态分布、渠道、方向、周趋势与面试结果分析。
- **Data portability**：支持 Excel 导入 / 导出，以及完整 JSON Backup / Restore。
- **Desktop UX**：Command Palette、键盘快捷键、桌面通知、统一 Toast、Skeleton、空状态与 ErrorBoundary。
- **Local-first**：核心数据保存在本机 SQLite，不依赖账号或云端服务。

## Quality gates

v0.1.0 发布候选已通过：

- TypeScript typecheck
- ESLint
- 41 个 Unit / Integration tests
- Production build
- Electron Playwright E2E
- Windows x64 NSIS installer build + artifact verification
- 最终 E2E 主链路：新增岗位 → 优先级 → 已投递 → 测评 / 笔试 → 面试创建与复盘 → Kanban 拖拽 → Offer → Timeline → 重启后持久化

## Install

下载 Windows x64 安装程序：

`JobFlow-0.1.0-Setup.exe`

安装器支持选择安装目录，并创建开始菜单 / 桌面快捷方式。

## Data & upgrade

SQLite 数据位于 Electron `userData` 目录，不存放在安装目录。正常升级不会主动删除本地数据库。升级前建议在 Settings 中导出一份 JSON Backup。

## Known limitations

- v0.1.0 当前只发布 Windows x64 安装包。
- 暂无账号、云同步、自动投递、爬虫或 AI 自动填写功能。
- 当前安装包未配置商业代码签名，部分 Windows 环境可能显示来源 / SmartScreen 提示。
