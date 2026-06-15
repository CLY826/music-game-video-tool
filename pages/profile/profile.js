// pages/profile/profile.js - 个人中心
const app = getApp();
const db = wx.cloud.database();

Page({
  data: {
    userInfo: null,
    openid: '',
    // Tab: 'videos' | 'favorites'
    activeTab: 'videos',

    // 我的视频
    myVideos: [],
    videoCount: 0,

    // 我的收藏
    myFavorites: [],
    favoriteCount: 0,

    loading: true
  },

  onLoad() {
    app.getOpenid(openid => {
      this.setData({ openid });
      this.loadAll(openid);
    });
    this.setData({ userInfo: app.globalData.userInfo });
  },

  onShow() {
    if (this.data.openid) {
      this.loadAll(this.data.openid);
    }
  },

  onPullDownRefresh() {
    if (this.data.openid) {
      this.loadAll(this.data.openid)
        .finally(() => wx.stopPullDownRefresh());
    }
  },

  /**
   * 并行加载我的视频和我的收藏
   */
  async loadAll(openid) {
    this.setData({ loading: true });
    await Promise.all([
      this.loadMyVideos(openid),
      this.loadMyFavorites(openid)
    ]);
    this.setData({ loading: false });
  },

  /**
   * 加载我的视频
   */
  async loadMyVideos(openid) {
    try {
      const res = await db.collection('video')
        .where({ openid })
        .orderBy('createTime', 'desc')
        .get();

      const list = (await fillThumbUrls(res.data)).map(v => ({
        ...v,
        createTimeText: formatTime(v.createTime)
      }));

      this.setData({ myVideos: list, videoCount: list.length });
    } catch (e) {
      console.error('加载我的视频失败', e);
    }
  },

  /**
   * 加载我的收藏
   */
  async loadMyFavorites(openid) {
    try {
      const res = await db.collection('favorite')
        .where({ openid })
        .orderBy('createTime', 'desc')
        .get();

      const list = (await fillThumbUrlsFromFav(res.data)).map(f => ({
        ...f,
        createTimeText: formatTime(f.createTime)
      }));

      this.setData({ myFavorites: list, favoriteCount: list.length });
    } catch (e) {
      console.error('加载我的收藏失败', e);
    }
  },

  /**
   * 切换 Tab
   */
  onTabChange(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
  },

  /**
   * 跳转播放页
   */
  onVideoTap(e) {
    const { videoId } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/player/player?videoId=${videoId}` });
  },

  /**
   * 点击收藏项，跳转播放页（用收藏记录里存的 videoId）
   */
  onFavTap(e) {
    const { videoId } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/player/player?videoId=${videoId}` });
  },

  /**
   * 取消收藏
   */
  onUnfavorite(e) {
    const { favId } = e.currentTarget.dataset;
    wx.showModal({
      title: '取消收藏',
      content: '确认取消收藏这个视频吗？',
      confirmColor: '#f44336',
      success: async res => {
        if (!res.confirm) return;
        try {
          await db.collection('favorite').doc(favId).remove();
          wx.showToast({ title: '已取消收藏', icon: 'success' });
          this.setData({
            myFavorites: this.data.myFavorites.filter(f => f._id !== favId),
            favoriteCount: this.data.favoriteCount - 1
          });
        } catch (e) {
          wx.showToast({ title: '操作失败', icon: 'none' });
        }
      }
    });
  },

  /**
   * 删除自己的视频
   * 同步把对应 game 分类的 videoCount -1
   */
  onDeleteVideo(e) {
    const { videoId, fileId, thumbFileId, gameId } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复，确认删除这个视频吗？',
      confirmColor: '#f44336',
      success: async res => {
        if (!res.confirm) return;
        wx.showLoading({ title: '删除中...' });
        try {
          // ① 删除数据库中的视频记录
          await db.collection('video').doc(videoId).remove();

          // ② 同步更新分类的视频数量（-1）
          if (gameId) {
            await db.collection('game').doc(gameId).update({
              data: { videoCount: db.command.inc(-1) }
            }).catch(err => console.warn('更新 game videoCount 失败', err));
          }

          // ③ 删除云存储文件（忽略失败，不阻塞主流程）
          const toDelete = [fileId, thumbFileId].filter(Boolean);
          if (toDelete.length > 0) {
            await wx.cloud.deleteFile({ fileList: toDelete }).catch(() => {});
          }

          wx.hideLoading();
          wx.showToast({ title: '已删除', icon: 'success' });
          // ④ 本地刷新列表
          this.setData({
            myVideos: this.data.myVideos.filter(v => v._id !== videoId),
            videoCount: this.data.videoCount - 1
          });
        } catch (e) {
          wx.hideLoading();
          console.error('删除失败', e);
          wx.showToast({ title: '删除失败', icon: 'none' });
        }
      }
    });
  },

  /**
   * 获取用户信息
   */
  onGetUserInfo(e) {
    if (e.detail.userInfo) {
      app.globalData.userInfo = e.detail.userInfo;
      this.setData({ userInfo: e.detail.userInfo });
    }
  },

  /**
   * 跳转上传
   */
  goUpload() {
    wx.navigateTo({ url: '/pages/upload/upload' });
  }
});

function formatTime(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 批量为视频列表填充 thumbUrl 临时链接
 */
async function fillThumbUrls(list) {
  const fileIds = list.map(v => v.thumbFileId).filter(Boolean);
  if (fileIds.length === 0) return list;
  try {
    const urlRes = await wx.cloud.getTempFileURL({ fileList: fileIds });
    const urlMap = {};
    urlRes.fileList.forEach(f => { urlMap[f.fileID] = f.tempFileURL; });
    return list.map(v => ({
      ...v,
      thumbUrl: (v.thumbFileId && urlMap[v.thumbFileId]) ? urlMap[v.thumbFileId] : ''
    }));
  } catch (e) {
    console.warn('获取封面链接失败', e);
    return list;
  }
}

/**
 * 批量为收藏列表填充 thumbUrl 临时链接
 * 收藏记录里用 thumbFileId 字段
 */
async function fillThumbUrlsFromFav(list) {
  const fileIds = list.map(f => f.thumbFileId).filter(Boolean);
  if (fileIds.length === 0) return list;
  try {
    const urlRes = await wx.cloud.getTempFileURL({ fileList: fileIds });
    const urlMap = {};
    urlRes.fileList.forEach(f => { urlMap[f.fileID] = f.tempFileURL; });
    return list.map(f => ({
      ...f,
      thumbUrl: (f.thumbFileId && urlMap[f.thumbFileId]) ? urlMap[f.thumbFileId] : ''
    }));
  } catch (e) {
    console.warn('获取收藏封面失败', e);
    return list;
  }
}
