# 软件测试贡献说明

姓名：陈立垚
学号：2312190228
角色：前端 / 后端
日期：2026-04-28

## 完成的测试工作

### 测试文件

**后端测试（7 个文件）：**
- `tests/backend/login.unit.test.js` — 登录云函数单元测试
- `tests/backend/getVideos.unit.test.js` — 视频查询单元测试
- `tests/backend/addComment.unit.test.js` — 评论发布单元测试
- `tests/backend/getComments.unit.test.js` — 评论查询单元测试
- `tests/backend/aiPolish.unit.test.js` — AI 润色单元测试
- `tests/backend/health.unit.test.js` — 健康检查单元测试
- `tests/backend/api.test.js` — 后端接口集成测试

**前端测试（5 个文件）：**
- `tests/frontend/index.component.test.js` — 首页组件测试
- `tests/frontend/index.extended.test.js` — 首页扩展测试
- `tests/frontend/upload.component.test.js` — 上传页组件测试
- `tests/frontend/upload.extended.test.js` — 上传页扩展测试
- `tests/frontend/network.request.test.js` — 网络请求测试

### 测试清单

- [x] 正常情况测试（34 个）
- [x] 边界 / 异常情况测试（15 个）
- [x] Mock 使用（数据库 / API / 组件外部依赖）

**Mock 文件：**
- `tests/backend/__mocks__/wx-server-sdk.js` — 模拟微信云服务端 SDK（数据库、云函数上下文）
- `tests/frontend/__mocks__/wx-globals.js` — 模拟微信小程序全局 API（wx.request、wx.cloud 等）

### 覆盖率

- 后端核心模块覆盖率：97.01%
- 前端核心模块覆盖率：61.26%
- 总测试用例数：49 个（后端 34 个 + 前端 23 个）
- CI 覆盖率：96.07%

### AI 辅助

- 使用工具：WorkBuddy AI
- Prompt 示例："为 login 云函数编写单元测试，覆盖正常登录、新用户注册、数据库异常等场景"
- AI 生成 + 人工修改的测试数量：49 个（AI 生成基础框架，人工调整断言和边界用例）

## PR 链接

- PR #1: https://github.com/CLY826/music-game-video-tool/pull/1

## 遇到的问题和解决

1. 问题：login 云函数返回字段名 openid 误写成 open_id，导致 3 个单元测试失败
   解决：对比测试文件中的断言，定位字段名不一致问题，将 open_id 改回 openid，测试全部通过

2. 问题：health 云函数新增后没有对应的单元测试，导致 CI 测试覆盖率检查失败
   解决：新增 health.unit.test.js，覆盖数据库连通性检查、环境变量检查、返回格式验证 3 个测试用例，覆盖率恢复至 96.07%

3. 问题：前端测试中微信小程序组件 API（如 setData、wx.request）无法在 Jest 环境直接使用
   解决：创建 wx-globals.js Mock 文件，模拟微信小程序全局 API，使前端组件测试在 Node.js 环境正常运行

## 心得体会

通过编写测试，我深刻理解了"测试驱动开发"的价值。后端测试覆盖了正常流程、边界情况和异常处理，97% 的覆盖率让我对代码质量有了信心。前端测试虽然受限于小程序运行环境的特殊性，通过 Mock 机制也实现了 61% 的覆盖率。

Mock 的使用是本次测试的重点和难点。微信云开发的 SDK 和小程序全局 API 都需要在 Jest 环境中模拟，编写 Mock 文件的过程让我更深入地理解了这些 API 的行为和边界。同时，测试也帮我发现了字段名拼写错误等隐藏问题，证明了测试不仅是验证功能，更是发现问题的手段。
