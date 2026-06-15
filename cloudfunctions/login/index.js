// cloudfunctions/login/index.js
// 云函数：用户登录 & 初始化 user 集合
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (_event, _context) => {
  const { OPENID, APPID } = cloud.getWXContext();

  try {
    // 查询 user 集合是否已存在该用户
    const { data } = await db.collection('user')
      .where({ openid: OPENID })
      .limit(1)
      .get();

    if (data.length === 0) {
      // 首次登录，写入 user 集合
      await db.collection('user').add({
        data: {
          openid: OPENID,
          appid: APPID,
          nickName: '匿名用户',
          avatarUrl: '',
          createTime: db.serverDate(),
          lastLoginTime: db.serverDate()
        }
      });
    } else {
      // 更新最后登录时间
      await db.collection('user').doc(data[0]._id).update({
        data: { lastLoginTime: db.serverDate() }
      });
    }

    return {
      openid: OPENID,
      userInfo: data[0] || null
    };
  } catch (e) {
    console.error('login error', e);
    return { openid: OPENID, userInfo: null };
  }
};
