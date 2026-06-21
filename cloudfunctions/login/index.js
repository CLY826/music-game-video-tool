// cloudfunctions/login/index.js
// 云函数：用户登录 & 初始化 user 集合
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
    service: 'login',
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

exports.main = async (_event, _context) => {
  const startTime = Date.now();
  const { OPENID, APPID } = cloud.getWXContext();

  structuredLog('INFO', 'login 请求开始', { hasOpenId: !!OPENID });

  try {
    // 查询 user 集合是否已存在该用户
    const { data } = await db.collection('user')
      .where({ open_id: OPENID })
      .limit(1)
      .get();

    if (data.length === 0) {
      // 首次登录，写入 user 集合
      structuredLog('INFO', 'login 首次登录', { OPENID });
      await db.collection('user').add({
        data: {
          open_id: OPENID,
          app_id: APPID,
          nick_name: '匿名用户',
          avatar_url: '',
          create_time: db.serverDate(),
          last_login_time: db.serverDate()
        }
      });
    } else {
      // 更新最后登录时间
      structuredLog('INFO', 'login 重复登录，更新时间', { OPENID });
      await db.collection('user').doc(data[0]._id).update({
        data: { last_login_time: db.serverDate() }
      });
    }

    const duration = Date.now() - startTime;
    structuredLog('INFO', 'login 成功', { durationMs: duration });

    return {
      open_id: OPENID,
      userInfo: data[0] || null
    };
  } catch (e) {
    const duration = Date.now() - startTime;
    structuredLog('ERROR', 'login 失败', { error: e.message, durationMs: duration });
    // 不向客户端暴露内部错误详情，只返回通用提示
    return { open_id: OPENID, userInfo: null, errorMsg: '登录服务暂时不可用' };
  }
};
