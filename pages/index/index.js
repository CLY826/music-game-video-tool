// pages/index/index.js - 首页
const app = getApp();
const db = wx.cloud.database();

Page({
  data: {
    // 音游分类列表
    games: [],
    // 最近上传的视频（最新6条）
    recentVideos: [],
    // 是否加载中
    loading: true,
    // 搜索关键词（用于顶部搜索跳转）
    searchKeyword: ''
  },

  onLoad() {
    this.loadGames();
    this.loadRecentVideos();
  },

  onShow() {
    // 每次显示时刷新最新视频
    this.loadRecentVideos();
  },

  onPullDownRefresh() {
    Promise.all([this.loadGames(), this.loadRecentVideos()])
      .finally(() => wx.stopPullDownRefresh());
  },

  /**
   * 加载音游分类列表
   * 先读云数据库 game 集合，若为空则写入默认分类
   */
  async loadGames() {
    try {
      const res = await db.collection('game').orderBy('sort', 'asc').get();
      if (res.data.length === 0) {
        // 首次运行：写入默认分类
        await this.initDefaultGames();
        return this.loadGames();
      }
      this.setData({ games: res.data });
    } catch (e) {
      console.error('加载分类失败', e);
    }
  },

  /**
   * 初始化默认音游分类（只执行一次）
   */
  async initDefaultGames() {
    const defaults = app.globalData.defaultGames;
    const tasks = defaults.map((g, idx) =>
      db.collection('game').add({
        data: { name: g.name, icon: g.icon, color: g.color, sort: idx, videoCount: 0 }
      })
    );
    await Promise.all(tasks);
  },

  /**
   * 加载最近上传的视频（取6条）
   */
  async loadRecentVideos() {
    this.setData({ loading: true });
    try {
      const res = await db.collection('video')
        .orderBy('createTime', 'desc')
        .limit(6)
        .get();
      const list = await fillThumbUrls(res.data);
      this.setData({ recentVideos: list, loading: false });
    } catch (e) {
      console.error('加载视频失败', e);
      this.setData({ loading: false });
    }
  },

  /**
   * 点击分类跳转分类页
   */
  onGameTap(e) {
    const { gameName, gameId } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/category/category?gameId=${gameId}&gameName=${gameName}`
    });
  },

  /**
   * 点击视频卡片跳转播放页
   */
  onVideoTap(e) {
    const { videoId } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/player/player?videoId=${videoId}`
    });
  },

  /**
   * 搜索框输入
   */
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  /**
   * 点击搜索或确认时跳转搜索页
   */
  onSearchConfirm() {
    const kw = this.data.searchKeyword.trim();
    wx.navigateTo({
      url: `/pages/search/search?keyword=${encodeURIComponent(kw)}`
    });
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
 * 每次调用时重新获取，避免旧链接过期
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
