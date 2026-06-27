# 项目规则

## 技术栈
前端: 微信小程序 (WXML + WXSS + JS)
后端: 微信云开发 (云函数 + 云数据库 + 云存储)
部署: 腾讯云（微信云开发平台）
开发工具: 微信开发者工具
测试: Jest (后端 97%+ / 前端 92%+ 覆盖率)
CI: GitHub Actions (Node.js 22 LTS, ESLint + Jest + Codecov)

## 目录结构
pages/             - 小程序页面（7 个: index/category/upload/player/search/community/profile）
cloudfunctions/    - 云函数（6 个: login/getVideos/addComment/getComments/aiPolish/health）
tests/backend/     - 后端单元测试
tests/frontend/    - 前端单元测试
tests/backend/__mocks__/ - Jest Mock 文件（wx-server-sdk.js 等）
docs/              - 项目文档
docs/contributions/ - 贡献说明文档（10 份）
docker/            - Docker 健康检查服务
cloudfunctionTemplate/ - 云函数模板

## 代码规范
云函数使用 structuredLog() 输出结构化日志（JSON 格式）
云函数返回统一格式: { code: 0, data: {...} } 或 { code: -1, message: '错误信息' }
小程序页面使用 wx.cloud.callFunction() 调用云函数
视频上传使用 wx.cloud.uploadFile() 直接上传，不走云函数中转
API Key 等敏感信息通过环境变量读取，不要硬编码

## 数据库集合
user     - 用户信息（openid 映射）
video    - 视频记录
comment  - 评论
game     - 音游分类
favorite - 收藏记录

## 禁止事项
不要把 API Key / 密钥硬编码在代码中
不要修改 project.config.json 的 appid 和 cloudfunctionRoot
不要移动 pages/ 或 cloudfunctions/ 到其他目录（微信小程序框架要求固定位置）
不要在小程序代码中直接操作数据库（应通过云函数）
不要使用 console.log/error/warn 替代 structuredLog（云函数中）
不要删除 __mocks__ 目录（Jest 测试需要）
不要把 tests/docs/docker/node_modules 目录包含到小程序包中

## 环境变量
云开发控制台需配置: TOKENHUB_API_KEY（AI 润色功能必需）
本地开发无需配置，云函数部署后自动通过 process.env 读取

## 云函数部署
每个云函数需要有 config.json（timeout/runtime/memorySize/installDependency）
部署方式: 微信开发者工具右键云函数文件夹 → "上传并部署：云端安装依赖"
不要短时间内连续部署多个云函数（会触发 API 频率限制）

## 项目配置文件
project.config.json - 小程序项目配置（含 packOptions.ignore 规则）
app.js - 小程序入口（云开发初始化 + 登录）
app.json - 小程序页面路由和窗口配置
