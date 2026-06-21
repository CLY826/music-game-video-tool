// cloudfunctions/health/index.js
// 健康检查云函数 - 用于监控服务可用性

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

/**
 * 结构化日志工具
 */
function structuredLog(level, message, extra = {}) {
  const logEntry = {
    time: new Date().toISOString(),
    level: level,
    service: 'health',
    message: message,
    ...extra,
  };
  console.log(JSON.stringify(logEntry));
}

exports.main = async (event, _context) => {
  const startTime = Date.now();

  try {
    structuredLog('INFO', '健康检查请求开始', { event });

    // 检查云环境数据库连接
    const db = cloud.database();
    let dbStatus = 'unknown';
    try {
      await db.collection('user').limit(1).get();
      dbStatus = 'connected';
    } catch (e) {
      dbStatus = 'disconnected';
      structuredLog('WARN', '数据库连接异常', { error: e.message });
    }

    // 检查环境变量配置
    const envCheck = {
      TOKENHUB_API_KEY: !!process.env.TOKENHUB_API_KEY,
    };

    const result = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      env: process.env.NODE_ENV || 'development',
      checks: {
        database: dbStatus,
        envVars: envCheck,
      },
      uptime: process.uptime ? process.uptime() : 'N/A',
    };

    const duration = Date.now() - startTime;
    structuredLog('INFO', '健康检查完成', { durationMs: duration, status: result.status });

    return {
      code: 0,
      data: result,
    };
  } catch (e) {
    const duration = Date.now() - startTime;
    structuredLog('ERROR', '健康检查失败', { error: e.message, durationMs: duration });
    return {
      code: -1,
      msg: '健康检查失败',
      error: e.message,
    };
  }
};
