# JobFlow

JobFlow 是一个面向个人秋招 / 校招场景的本地优先求职投递管理软件。

**Current version: v0.1.0**

## Product scope

核心体验：

- 快速记录公司与岗位
- List / Kanban Pipeline 状态推进
- Timeline 流程历史
- Today 下一步与截止日期提醒
- 面试安排与复盘
- 求职数据分析
- Excel 导入 / 导出与 JSON 完整备份
- Command Palette、快捷键与桌面通知

V1 坚持本地优先，不引入账号、云同步、自动投递、爬虫或复杂 AI 功能。

## Tech stack

- Electron 38
- React 19 + TypeScript
- Vite / electron-vite
- Tailwind CSS
- SQLite + Drizzle ORM
- Vitest
- Playwright Electron E2E
- electron-builder + NSIS

## Development

```bash
npm install
npm run dev
```

完整验证：

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
```

Windows x64 安装包：

```bash
npm run dist:win
```

产物位于 `release/JobFlow-0.1.0-Setup.exe`。

## Local data

JobFlow 的 SQLite 数据保存在 Electron `userData` 目录，而不是应用安装目录。升级或重新安装应用不会主动覆盖数据库；重要升级前仍建议在 Settings 中导出 JSON Backup。

## Branch strategy

- `main`: 稳定主分支
- `Prototype`: V1 开发 / 发布候选分支
- `ci/stage-*`: 临时阶段验收分支，通过并合入后应清理

## Release

### v0.1.0

首个可安装 V1 版本。完整变更说明见 `RELEASE_NOTES_v0.1.0.md`。
