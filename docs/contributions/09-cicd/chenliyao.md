# CI/CD 配置贡献说明

姓名：陈立垚
学号：2312190228
角色：前端 / 后端
日期：2026-05-5

## 完成的工作

### 工作流相关

- [x] 参与编写 / 审查 `.github/workflows/ci.yml`
- [x] 配置 Codecov 覆盖率上传（backend / frontend flag）
- [x] 添加 README 状态徽章

### 代码适配

- [x] 本地测试命令与 CI 一致，无需额外配置
- [x] 代码通过 Lint 检查（ESLint）
- [x] 核心覆盖率达标（> 60%）

### 可选项

- [ ] 配置 Dependabot 自动更新依赖
- [ ] 集成 CodeRabbit AI 代码审查
- [ ] 使用 act 本地验证工作流

## PR 链接

- PR #1: https://github.com/CLY826/music-game-video-tool/pull/1

## CI 运行链接

- https://github.com/CLY826/music-game-video-tool/actions

## 遇到的问题和解决

1. 问题：CI 中 ESLint 检查报错，cloudfunctions 目录下有未使用的变量和格式问题
   解决：逐一修复 ESLint 报告的所有 warning 和 error，并在 CI 中添加 --max-warnings 0 参数确保零警告通过

2. 问题：login 云函数返回字段名 openid 误写成 open_id，导致 CI 中 3 个单元测试失败
   解决：对比测试文件中的断言，定位字段名不一致问题，将 open_id 改回 openid，49 个测试全部通过

3. 问题：health 云函数新增后没有对应的单元测试，导致 CI 测试覆盖率检查失败
   解决：新增 health.unit.test.js，覆盖 3 个测试用例，最终覆盖率恢复至 96.07%

## 心得体会

通过配置 CI/CD，我深刻体会到自动化测试的重要性。GitHub Actions 让每次代码提交都自动经过 ESLint 检查和 Jest 测试，避免了"本地能跑但线上挂了"的问题。Codecov 覆盖率上传则让测试质量可视化，后端覆盖率 97%+、前端覆盖率 61%+，核心逻辑得到了充分测试。

配置过程中也遇到了因字段名拼写错误导致 CI 失败的问题，这提醒我 CI 不仅是为了"通过"，更是为了"发现问题"——如果没有 CI，这个错误可能要到运行时才会暴露。养成提交前本地跑测试的习惯，配合 CI 的双重保障，才能保证代码质量。
