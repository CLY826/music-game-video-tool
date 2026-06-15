// pages/category/category.js - 分类页（展示某音游下所有视频）
const db = wx.cloud.database();

Page({
  data: {
    gameId: '',
    gameName: '全部视频',
    videos: [],
    loading: true,
    page: 0,
    pageSize: 10,
    hasMore: true,
    sortBy: 'createTime'  // createTime | songName
  },

  onLoad(options) {
    const { gameId = '', gameName = '全部视频' } = options;
    this.setData({ gameId, gameName });
    wx.setNavigationBarTitle({ title: gameName });
    this.loadVideos(true);
  },

  onPullDownRefresh() {
    this.loadVideos(true).finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasMore) {
      this.loadVideos(false);
    }
  },

  /**
   * 加载视频列表
   * @param {boolean} reset - true 时重置分页
   */
  async loadVideos(reset = false) {
    if (reset) {
      this.setData({ page: 0, videos: [], hasMore: true });
    }
    if (!this.data.hasMore && !reset) return;

    this.setData({ loading: true });
    try {
      let query = db.collection('video');

      // 若有分类过滤
      if (this.data.gameId) {
        query = query.where({ gameId: this.data.gameId });
      }

      const { sortBy, page, pageSize } = this.data;
      const res = await query
        .orderBy(sortBy, sortBy === 'songName' ? 'asc' : 'desc')
        .skip(page * pageSize)
        .limit(pageSize)
        .get();

      const newVideos = (await fillThumbUrls(res.data)).map(v => ({
        ...v,
        createTimeText: formatTime(v.createTime)
      }));

      this.setData({
        videos: reset ? newVideos : [...this.data.videos, ...newVideos],
        page: page + 1,
        hasMore: res.data.length === pageSize,
        loading: false
      });
    } catch (e) {
      console.error('加载视频列表失败', e);
      this.setData({ loading: false });
    }
  },

  /**
   * 切换排序方式
   */
  onSortChange(e) {
    this.setData({ sortBy: e.currentTarget.dataset.sort });
    this.loadVideos(true);
  },

  /**
   * 跳转播放页
   */
  onVideoTap(e) {
    const { videoId } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/player/player?videoId=${videoId}` });
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

/**
 * 格式化时间显示
 */
function formatTime(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}天前`;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
