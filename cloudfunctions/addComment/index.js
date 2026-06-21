// cloudfunctions/addComment/index.js
// 云函数：发布评论（服务端验证 + 写入）
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
    service: 'addComment',
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
  const { OPENID } = cloud.getWXContext();
  const { videoId, content, authorName = '匿名用户', authorAvatar = '' } = event;

  structuredLog('INFO', 'addComment 请求开始', {
    hasVideoId: !!videoId,
    contentLength: content ? content.trim().length : 0,
  });

  // 鉴权校验：拒绝未登录用户调用
  if (!OPENID) {
    structuredLog('WARN', 'addComment 未授权调用', { OPENID });
    return { code: -1, message: '未授权调用，请先登录' };
  }

  if (!videoId || !content || !content.trim()) {
    return { code: -1, message: '参数不完整' };
  }

  if (content.trim().length > 500) {
    structuredLog('WARN', '评论内容超长', { length: content.trim().length });
    return { code: -1, message: '评论长度不能超过500字' };
  }

  // 输入净化：移除前后空白，限制 authorName 长度
  const safeAuthorName = (authorName || '匿名用户').trim().slice(0, 30);
  const safeVideoId = videoId.trim();

  try {
    const addRes = await db.collection('comment').add({
      data: {
        videoId: safeVideoId,
        content: content.trim(),
        open_id: OPENID,
        authorName: safeAuthorName,
        authorAvatar,
        createTime: db.serverDate()
      }
    });

    // 更新视频评论数
    await db.collection('video').doc(videoId).update({
      data: { commentCount: db.command.inc(1) }
    });

    const duration = Date.now() - startTime;
    structuredLog('INFO', 'addComment 成功', {
      commentId: addRes._id,
      durationMs: duration,
    });

    return { code: 0, id: addRes._id };
  } catch (e) {
    const duration = Date.now() - startTime;
    structuredLog('ERROR', 'addComment 失败', { error: e.message, durationMs: duration });
    // 不向客户端暴露内部错误详情
    return { code: -1, message: '评论服务暂时不可用' };
  }
};
