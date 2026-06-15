// cloudfunctions/getVideos/index.js
// 云函数：分页查询视频（支持按 gameId 过滤）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, _context) => {
  const {
    gameId = '',
    page = 0,
    pageSize = 10,
    sortBy = 'createTime',
    keyword = ''
  } = event;

  try {
    let query = db.collection('video');

    // 分类过滤
    if (gameId) {
      query = query.where({ gameId });
    }

    // 关键词搜索（在云函数侧做正则，避免前端 quota 限制）
    if (keyword) {
      query = query.where({
        songName: db.RegExp({ regexp: keyword, options: 'i' })
      });
    }

    const total = await query.count();

    const order = sortBy === 'songName' ? 'asc' : 'desc';
    const res = await query
      .orderBy(sortBy, order)
      .skip(page * pageSize)
      .limit(pageSize)
      .get();

    return {
      code: 0,
      data: res.data,
      total: total.total,
      hasMore: res.data.length === pageSize
    };
  } catch (e) {
    console.error('getVideos error', e);
    return { code: -1, message: e.message };
  }
};
