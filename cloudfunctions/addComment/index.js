// cloudfunctions/addComment/index.js
// 云函数：发布评论（服务端验证 + 写入）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { videoId, content, authorName = '匿名用户', authorAvatar = '' } = event;

  if (!videoId || !content || !content.trim()) {
    return { code: -1, message: '参数不完整' };
  }

  if (content.trim().length > 500) {
    return { code: -1, message: '评论长度不能超过500字' };
  }

  try {
    const addRes = await db.collection('comment').add({
      data: {
        videoId,
        content: content.trim(),
        openid: OPENID,
        authorName,
        authorAvatar,
        createTime: db.serverDate()
      }
    });

    // 更新视频评论数
    await db.collection('video').doc(videoId).update({
      data: { commentCount: db.command.inc(1) }
    });

    return { code: 0, id: addRes._id };
  } catch (e) {
    console.error('addComment error', e);
    return { code: -1, message: e.message };
  }
};
