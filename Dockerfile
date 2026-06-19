# 音游视频练习辅助小程序 - 本地开发环境
# 基于 Node.js 22 LTS，提供一致的开发与测试环境

FROM node:22-alpine

# 设置工作目录
WORKDIR /app

# 安装测试与 lint 工具
RUN npm install -g jest@29 eslint@8

# 复制项目依赖描述文件（利用 Docker 缓存层）
COPY package*.json ./
COPY cloudfunctions/*/package.json ./cloudfunctions-temp/

# 安装根目录依赖
RUN npm install --only=production && npm install --only=development

# 复制全部项目文件
COPY . .

# 安装所有云函数依赖
RUN for dir in cloudfunctions/*/; do \
      if [ -f "$dir/package.json" ]; then \
        echo "Installing dependencies for $dir"; \
        cd "$dir" && npm install --only=production && cd /app; \
      fi; \
    done || true

# 安装测试依赖
RUN if [ -d "tests" ]; then cd tests && npm install && cd /app; fi || true

# 设置环境变量（默认占位值，实际运行时通过 docker-compose 覆盖）
ENV TOKENHUB_API_KEY=dev-placeholder
ENV NODE_ENV=development

# 暴露端口（用于本地 mock 服务）
EXPOSE 3000

# 默认命令：保持容器运行，等待用户进入
CMD ["sh", "-c", "echo '=== 音游视频练习辅助小程序 开发环境 ===' && echo '运行测试: npm test' && echo '运行 lint: npx eslint cloudfunctions/' && tail -f /dev/null"]
