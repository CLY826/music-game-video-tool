// cloudfunctions/getComments/index.js
// 云函数：查询某视频的评论列表
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

/**
 * 结构化日志工具
 */
function structuredLog(level, message, extra = {}) {
  const entry = {
    time: new Date().toISOString(),
    level: level,
    service: 'getComments',
    message: message,
    ...extra,
  };
  if (level === 'ERROR') {
    console.error(JSON.stringify(entry));
  } else if (level === 'WARN') {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

exports.main = async (event, _context) => {
  const startTime = Date.now();
  const { videoId, page = 0, pageSize = 20 } = event;

  structuredLog('INFO', 'getComments 请求开始', {
    hasVideoId: !!videoId,
    page, pageSize,
  });

  if (!videoId || !videoId.trim()) {
    return { code: -1, message: 'videoId 不能为空' };
  }

  // 分页参数安全校验
  const safePage = Math.max(0, Math.min(Number(page) || 0, 100));
  const safePageSize = Math.max(1, Math.min(Number(pageSize) || 20, 50));

  try {
    const res = await db.collection('comment')
      .where({ videoId: videoId.trim() })
      .orderBy('createTime', 'desc')
      .skip(safePage * safePageSize)
      .limit(safePageSize)
      .get();

    const duration = Date.now() - startTime;
    structuredLog('INFO', 'getComments 查询成功', {
      durationMs: duration,
      resultCount: res.data.length,
    });

    return {
      code: 0,
      data: res.data,
      hasMore: res.data.length === safePageSize
    };
  } catch (e) {
    const duration = Date.now() - startTime;
    structuredLog('ERROR', 'getComments 查询失败', {
      error: e.message,
      durationMs: duration,
    });
    // 不向客户端暴露内部错误详情
    return { code: -1, message: '查询服务暂时不可用' };
  }
};
