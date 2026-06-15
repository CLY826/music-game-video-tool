// pages/community/community.js - 玩家社区页
const db = wx.cloud.database();

Page({
  data: {
    videos: [],
    loading: true,
    page: 0,
    pageSize: 10,
    hasMore: true,
    openid: ''
  },

  onLoad() {
    const app = getApp();
    app.getOpenid(openid => this.setData({ openid }));
    this.loadCommunityVideos(true);
  },

  onShow() {
    // tab 切回时刷新
  },

  onPullDownRefresh() {
    this.loadCommunityVideos(true).finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasMore) this.loadCommunityVideos(false);
  },

  /**
   * 加载社区视频（所有用户上传，按时间降序）
   */
  async loadCommunityVideos(reset = false) {
    if (reset) this.setData({ page: 0, videos: [], hasMore: true });
    if (!this.data.hasMore && !reset) return;

    this.setData({ loading: true });
    try {
      const { page, pageSize } = this.data;
      const res = await db.collection('video')
        .orderBy('createTime', 'desc')
        .skip(page * pageSize)
        .limit(pageSize)
        .get();
      const list = (await fillThumbUrls(res.data)).map(v => ({
        ...v,
        createTimeText: formatTime(v.createTime)
      }));

      this.setData({
        videos: reset ? list : [...this.data.videos, ...list],
        page: page + 1,
        hasMore: res.data.length === pageSize,
        loading: false
      });
    } catch (e) {
      console.error('加载社区视频失败', e);
      this.setData({ loading: false });
    }
  },

  /**
   * 跳转播放页
   */
  onVideoTap(e) {
    const { videoId } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/player/player?videoId=${videoId}` });
  },

  /**
   * 跳转上传页
   */
  goUpload() {
    wx.navigateTo({ url: '/pages/upload/upload' });
  }
});

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

function formatTime(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}天前`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
