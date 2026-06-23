/**
 * Docker 容器健康检查服务
 * 在容器内启动一个简单的 HTTP 服务，提供 /health 端点
 * 供 Docker healthcheck 调用，判断容器是否正常运行
 */
const http = require('http');

const PORT = process.env.HEALTH_PORT || 3000;

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'rhythm-practice-docker',
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(PORT, () => {
  console.log(`[Health Check] 服务已启动，端口: ${PORT}`);
});
