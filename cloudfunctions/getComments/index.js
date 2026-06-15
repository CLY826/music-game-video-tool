// cloudfunctions/getComments/index.js
// 云函数：查询某视频的评论列表
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, _context) => {
  const { videoId, page = 0, pageSize = 20 } = event;
  if (!videoId) return { code: -1, message: 'videoId 不能为空' };

  try {
    const res = await db.collection('comment')
      .where({ videoId })
      .orderBy('createTime', 'desc')
      .skip(page * pageSize)
      .limit(pageSize)
      .get();

    return {
      code: 0,
      data: res.data,
      hasMore: res.data.length === pageSize
    };
  } catch (e) {
    console.error('getComments error', e);
    return { code: -1, message: e.message };
  }
};
