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

  // 分页参数安全校验：防止恶意大 pageSize 拖垮服务
  const safePage = Math.max(0, Math.min(Number(page) || 0, 100));
  const safePageSize = Math.max(1, Math.min(Number(pageSize) || 10, 50));

  // sortBy 白名单校验：只允许合法排序字段
  const ALLOWED_SORT_FIELDS = ['createTime', 'songName'];
  const safeSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createTime';

  // keyword 长度限制
  const safeKeyword = (keyword || '').trim().slice(0, 50);

  try {
    let query = db.collection('video');

    // 分类过滤
    if (gameId) {
      query = query.where({ gameId: gameId.trim() });
    }

    // 关键词搜索（在云函数侧做正则，避免前端 quota 限制）
    if (safeKeyword) {
      query = query.where({
        songName: db.RegExp({ regexp: safeKeyword, options: 'i' })
      });
    }

    const total = await query.count();

    const order = safeSortBy === 'songName' ? 'asc' : 'desc';
    const res = await query
      .orderBy(safeSortBy, order)
      .skip(safePage * safePageSize)
      .limit(safePageSize)
      .get();

    return {
      code: 0,
      data: res.data,
      total: total.total,
      hasMore: res.data.length === safePageSize
    };
  } catch (e) {
    console.error('getVideos error', e);
    // 不向客户端暴露内部错误详情
    return { code: -1, message: '查询服务暂时不可用' };
  }
};
