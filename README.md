# JobFlow

JobFlow 是一个面向个人秋招 / 校招场景的本地优先求职投递管理软件。

## Product scope

核心体验：

- 快速记录岗位
- Pipeline 状态推进
- 下一步与截止日期提醒
- 面试记录与复盘
- 简洁的求职数据分析

V1 坚持本地优先，不引入账号、云同步、自动投递、爬虫或复杂 AI 功能。

## Tech stack

- Electron
- React + TypeScript
- Vite / electron-vite
- Tailwind CSS
- SQLite + Drizzle ORM（Stage 1）
- Vitest

## Development

```bash
npm install
npm run dev
```

验证：

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Branch strategy

- `main`: 稳定主分支
- `Prototype`: 当前原型开发分支
- `ci/stage-*`: 阶段验收临时分支

每个 Stage 通过 CI 后才推进到 `Prototype`。
