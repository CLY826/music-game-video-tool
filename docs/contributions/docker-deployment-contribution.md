# Docker 部署贡献说明

姓名：陈立垚
学号：2312190228
日期：2026-06-22

## 我完成的工作

### 1. Dockerfile 编写

- [x] 前端 Dockerfile（多阶段构建）
- [x] 后端 Dockerfile（多阶段构建）
- [x] .dockerignore 文件

### 2. Compose 配置

- [x] 开发环境 compose.yaml
- [x] 生产环境 compose.prod.yaml
- [x] 健康检查配置

### 3. 自动化部署

- 选择了选项 A：本地 Docker 开发环境 + 生产环境配置
- 具体内容：在不修改原有项目代码的基础上，新增 Dockerfile、docker-compose.yml（开发环境）、compose.prod.yaml（生产环境）、.dockerignore 和健康检查服务，实现一键启动开发/测试/生产环境，通过 `docker compose up` 启动开发环境，`docker compose -f compose.prod.yaml up -d` 启动生产环境

## PR 链接

- PR #1: https://github.com/CLY826/music-game-video-tool/pull/1

## 遇到的问题和解决

1. 问题：微信小程序云开发项目没有传统的前后端分离结构，不能直接套用标准的 Docker 部署模板
   解决：根据项目实际结构定制 Dockerfile，将小程序前端页面和云函数分别处理，前端使用 Node.js 运行开发服务器，云函数通过本地模拟环境运行，确保不修改原有代码

2. 问题：Docker 容器内无法直接访问微信开发者工具的本地调试端口
   解决：通过 docker-compose.yml 配置端口映射，将容器内端口与宿主机端口绑定，开发时在宿主机使用微信开发者工具连接本地调试

## AI 使用情况

- 使用了哪些 Prompt：
  - "使用 Docker 完成项目的容器化部署，不修改原代码"
  - "只做本地 Docker 开发环境，并上传 GitHub"
  - "Dockerfile 在哪里"
- AI 帮助解决了哪些问题：
  - 根据微信小程序云开发项目的特殊结构，生成了适配的 Dockerfile 和 docker-compose.yml
  - 提供了 .dockerignore 配置，排除 node_modules 等不必要文件，减小镜像体积
  - 指导了 Docker Desktop 的安装和基本使用方法

## 心得体会

通过本次 Docker 部署实践，我理解了容器化部署的核心思想——将应用及其依赖打包到一个可移植的容器中，实现"一次构建，到处运行"。

微信小程序云开发项目的 Docker 化与传统 Web 项目有所不同，因为小程序的运行依赖微信开发者工具，不能完全在容器内运行。因此我选择了本地开发环境的方案，在不修改原有代码的前提下，通过 Docker 提供一致的 Node.js 运行环境，方便团队成员快速搭建开发环境。

在配置过程中，我也学会了如何编写高效的 .dockerignore 文件来优化镜像构建，以及如何使用 docker-compose 管理多容器编排，这些技能对未来的项目部署都有很大帮助。
