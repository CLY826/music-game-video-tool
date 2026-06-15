// pages/search/search.js - 搜索页
const db = wx.cloud.database();

Page({
  data: {
    keyword: '',
    results: [],
    loading: false,
    searched: false
  },

  onLoad(options) {
    const { keyword = '' } = options;
    if (keyword) {
      this.setData({ keyword });
      this.doSearch(keyword);
    }
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  /**
   * 触发搜索
   */
  onSearchConfirm() {
    const kw = this.data.keyword.trim();
    if (!kw) {
      wx.showToast({ title: '请输入搜索内容', icon: 'none' });
      return;
    }
    this.doSearch(kw);
  },

  /**
   * 清空搜索
   */
  onClear() {
    this.setData({ keyword: '', results: [], searched: false });
  },

  /**
   * 执行模糊搜索
   * 云数据库不支持 LIKE，使用正则 regex 实现
   */
  async doSearch(kw) {
    this.setData({ loading: true, searched: false });
    try {
      const res = await db.collection('video')
        .where({
          songName: db.RegExp({ regexp: kw, options: 'i' })
        })
        .orderBy('createTime', 'desc')
        .limit(30)
        .get();

      const list = (await fillThumbUrls(res.data)).map(v => ({
        ...v,
        createTimeText: formatTime(v.createTime),
        // 高亮匹配部分
        highlightName: highlightMatch(v.songName, kw)
      }));

      this.setData({ results: list, loading: false, searched: true });
    } catch (e) {
      console.error('搜索失败', e);
      this.setData({ loading: false, searched: true });
      wx.showToast({ title: '搜索失败，请重试', icon: 'none' });
    }
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

// 简单标记匹配片段（wxml 里用 rich-text 展示加粗）
function highlightMatch(text, kw) {
  if (!text || !kw) return text;
  const idx = text.toLowerCase().indexOf(kw.toLowerCase());
  if (idx < 0) return text;
  return text.slice(0, idx)
    + '<b style="color:#6c63ff">' + text.slice(idx, idx + kw.length) + '</b>'
    + text.slice(idx + kw.length);
}
