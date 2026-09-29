# JobFlow v0.1.1

JobFlow v0.1.1 是基于 v0.1.0 的功能更新版本，重点增强岗位录入与管理的灵活性。

## What's new

- **自定义岗位方向**：可在投递管理中新增和删除自定义方向，适配不同求职目标。
- **自定义投递渠道**：可维护自己的渠道选项，不再局限于预置渠道。
- **校招 / 实习区分**：岗位支持招聘类型字段，并可按校招或实习筛选。
- **删除岗位**：岗位详情中新增删除能力，并配套确认交互。
- **数据迁移兼容**：数据库迁移、备份 / 恢复与数据访问层同步支持新增字段和设置。
- **测试补强**：补充筛选、设置、数据迁移、Repository / Service 与 Electron E2E 覆盖。

## Quality gates

发布流程会重新执行：

- Runtime dependency audit
- TypeScript typecheck
- ESLint
- Unit / integration tests
- Production build
- Electron Playwright E2E
- Windows x64 NSIS installer build + artifact verification

## Install

下载 Windows x64 安装程序：

`JobFlow-0.1.1-Setup.exe`

安装器支持选择安装目录，并创建开始菜单 / 桌面快捷方式。

## Data & upgrade

SQLite 数据位于 Electron `userData` 目录。正常从 v0.1.0 升级到 v0.1.1 不会主动删除本地数据库；程序会执行兼容迁移。升级前仍建议在 Settings 中导出 JSON Backup。

## Known limitations

- 当前只发布 Windows x64 安装包。
- 安装包未配置商业代码签名，部分 Windows 环境可能显示来源 / SmartScreen 提示。
