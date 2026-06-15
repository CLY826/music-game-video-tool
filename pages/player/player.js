// pages/player/player.js - 视频播放页（支持变速 / AB循环）
const db = wx.cloud.database();

Page({
  data: {
    // 视频数据
    videoId: '',
    video: null,
    videoUrl: '',
    loading: true,

    // 播放器状态
    currentTime: 0,     // 当前播放时间(秒)
    duration: 0,        // 总时长(秒)
    playing: false,
    playbackRate: 1,    // 当前倍速
    rateOptions: [0.5, 0.75, 1.0, 1.25, 1.5],

    // AB 循环
    pointA: null,       // A点 (秒)，null 表示未设置
    pointB: null,       // B点 (秒)，null 表示未设置
    loopEnabled: false, // 是否开启 AB 循环
    loopCount: 0,       // 当前已循环次数

    // 进度条显示
    progressPercent: 0, // 0~100
    currentTimeText: '00:00',
    durationText: '00:00',
    pointAText: '--:--',
    pointBText: '--:--',

    // 评论
    comments: [],
    commentInput: '',
    commentLoading: false,
    commentPage: 0,
    commentPageSize: 20,
    commentHasMore: true,

    // 收藏状态
    isFavorited: false,
    favoriteId: '',     // 收藏记录的数据库 _id，用于取消收藏

    // 全屏状态
    isFullscreen: false,

    // 用户信息
    openid: ''
  },

  // 视频 context 用于控制播放
  videoCtx: null,
  // AB 循环检测定时器
  loopTimer: null,

  onLoad(options) {
    const { videoId } = options;
    this.setData({ videoId });
    this.videoCtx = wx.createVideoContext('mainVideo', this);
    this.loadVideo(videoId);
    this.loadComments(true);

    // 获取 openid
    const app = getApp();
    app.getOpenid(openid => {
      this.setData({ openid });
      this.checkFavorite(videoId, openid);
    });
  },

  onUnload() {
    // 离开页面时清除定时器
    this.clearLoopTimer();
  },

  /**
   * 加载视频信息
   * 每次进入页面都重新获取临时链接，避免数据库中存储的链接过期导致 403
   */
  async loadVideo(videoId) {
    try {
      const res = await db.collection('video').doc(videoId).get();
      const v = res.data;

      // 始终用 fileId 重新换取临时链接（有效期约2小时，每次进页面刷新）
      let videoUrl = '';
      if (v.videoFileId) {
        const urlRes = await wx.cloud.getTempFileURL({ fileList: [v.videoFileId] });
        videoUrl = urlRes.fileList[0]?.tempFileURL || '';
      }

      if (!videoUrl) {
        wx.showToast({ title: '获取视频链接失败', icon: 'none' });
        this.setData({ loading: false });
        return;
      }

      this.setData({
        video: v,
        videoUrl,
        durationText: formatDuration(v.duration),
        loading: false
      });
    } catch (e) {
      console.error('加载视频失败', e);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // ========== 收藏 ==========

  /**
   * 检查当前用户是否已收藏该视频
   */
  async checkFavorite(videoId, openid) {
    if (!openid) return;
    try {
      const res = await db.collection('favorite')
        .where({ videoId, openid })
        .limit(1)
        .get();
      if (res.data.length > 0) {
        this.setData({ isFavorited: true, favoriteId: res.data[0]._id });
      }
    } catch (e) {
      console.warn('检查收藏状态失败', e);
    }
  },

  /**
   * 切换收藏状态
   */
  async toggleFavorite() {
    const { openid, videoId, isFavorited, favoriteId, video } = this.data;
    if (!openid) {
      wx.showToast({ title: '登录中，请稍候', icon: 'none' });
      return;
    }

    if (isFavorited) {
      // 取消收藏
      try {
        await db.collection('favorite').doc(favoriteId).remove();
        this.setData({ isFavorited: false, favoriteId: '' });
        wx.showToast({ title: '已取消收藏', icon: 'none' });
      } catch {
        wx.showToast({ title: '操作失败', icon: 'none' });
      }
    } else {
      // 添加收藏
      try {
        const res = await db.collection('favorite').add({
          data: {
            videoId,
            openid,
            songName: video.songName,
            gameName: video.gameName,
            gameColor: video.gameColor,
            videoFileId: video.videoFileId,
            thumbFileId: video.thumbFileId || '',
            uploaderName: video.uploaderName || '',
            duration: video.duration || 0,
            durationText: video.durationText || '',
            createTime: db.serverDate()
          }
        });
        this.setData({ isFavorited: true, favoriteId: res._id });
        wx.showToast({ title: '收藏成功 ♥', icon: 'success' });
      } catch {
        wx.showToast({ title: '收藏失败', icon: 'none' });
      }
    }
  },

  // ========== 播放器事件 ==========

  /**
   * 切换播放/暂停
   */
  togglePlay() {
    if (this.data.playing) {
      this.videoCtx.pause();
    } else {
      this.videoCtx.play();
    }
  },

  // ========== 全屏控制 ==========

  /**
   * 进入全屏（CSS 模拟全屏，控件始终可见）
   */
  enterFullscreen() {
    wx.setNavigationBarVisible && wx.setNavigationBarVisible({ visible: false });
    this.setData({ isFullscreen: true });
  },

  /**
   * 退出全屏
   */
  exitFullscreen() {
    wx.setNavigationBarVisible && wx.setNavigationBarVisible({ visible: true });
    this.setData({ isFullscreen: false });
  },

  onVideoPlay() {
    this.setData({ playing: true });
    this.startLoopTimer();
  },

  onVideoPause() {
    this.setData({ playing: false });
    this.clearLoopTimer();
  },

  onVideoEnded() {
    this.setData({ playing: false, loopCount: 0 });
    this.clearLoopTimer();
  },

  onVideoError(e) {
    console.error('视频错误', e.detail);
    wx.showToast({ title: '视频播放失败', icon: 'none' });
  },

  /**
   * 时间更新回调（每 250ms 触发一次）
   */
  onVideoTimeUpdate(e) {
    const { currentTime, duration } = e.detail;
    const percent = duration > 0 ? (currentTime / duration) * 100 : 0;
    this.setData({
      currentTime,
      duration,
      progressPercent: percent,
      currentTimeText: formatDuration(currentTime),
      durationText: formatDuration(duration)
    });
  },

  // ========== AB 循环 ==========

  /**
   * 标记 A 点
   */
  setPointA() {
    const t = this.data.currentTime;
    // A 点不能 >= B 点
    if (this.data.pointB !== null && t >= this.data.pointB) {
      wx.showToast({ title: 'A点必须在B点之前', icon: 'none' });
      return;
    }
    this.setData({ pointA: t, pointAText: formatDuration(t) });
    wx.showToast({ title: `A点：${formatDuration(t)}`, icon: 'none', duration: 1000 });
  },

  /**
   * 标记 B 点
   */
  setPointB() {
    const t = this.data.currentTime;
    if (this.data.pointA !== null && t <= this.data.pointA) {
      wx.showToast({ title: 'B点必须在A点之后', icon: 'none' });
      return;
    }
    this.setData({ pointB: t, pointBText: formatDuration(t) });
    wx.showToast({ title: `B点：${formatDuration(t)}`, icon: 'none', duration: 1000 });
  },

  /**
   * 切换 AB 循环开关
   */
  toggleLoop() {
    const { pointA, pointB } = this.data;
    if (!this.data.loopEnabled) {
      if (pointA === null || pointB === null) {
        wx.showToast({ title: '请先设置A点和B点', icon: 'none' });
        return;
      }
    }
    const newLoop = !this.data.loopEnabled;
    this.setData({ loopEnabled: newLoop, loopCount: 0 });

    if (newLoop && pointA !== null) {
      // 跳到 A 点开始循环
      this.videoCtx.seek(pointA);
    }
    wx.showToast({
      title: newLoop ? '循环已开启' : '循环已关闭',
      icon: 'none',
      duration: 800
    });
  },

  /**
   * 清除 AB 点
   */
  clearAB() {
    this.setData({
      pointA: null,
      pointB: null,
      pointAText: '--:--',
      pointBText: '--:--',
      loopEnabled: false,
      loopCount: 0
    });
  },

  /**
   * 启动 AB 循环检测定时器
   * 每 200ms 检查当前时间是否超过 B 点
   */
  startLoopTimer() {
    this.clearLoopTimer();
    this.loopTimer = setInterval(() => {
      const { loopEnabled, pointA, pointB, currentTime } = this.data;
      if (loopEnabled && pointB !== null && currentTime >= pointB) {
        // 回到 A 点
        const seekTo = pointA !== null ? pointA : 0;
        this.videoCtx.seek(seekTo);
        this.setData({ loopCount: this.data.loopCount + 1 });
      }
    }, 200);
  },

  clearLoopTimer() {
    if (this.loopTimer) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
  },

  // ========== 变速 ==========

  /**
   * 切换播放速度
   */
  onRateTap(e) {
    const rate = e.currentTarget.dataset.rate;
    this.setData({ playbackRate: rate });
    this.videoCtx.playbackRate(rate);
    wx.showToast({ title: `${rate}x`, icon: 'none', duration: 800 });
  },

  // ========== 进度条拖拽 ==========

  /**
   * 用户拖拽进度条
   */
  onProgressChange(e) {
    const percent = e.detail.value;
    const seekTime = (percent / 100) * this.data.duration;
    this.videoCtx.seek(seekTime);
  },

  // ========== 评论 ==========

  /**
   * 加载评论列表
   */
  async loadComments(reset = false) {
    if (reset) this.setData({ commentPage: 0, comments: [], commentHasMore: true });
    if (!this.data.commentHasMore && !reset) return;

    this.setData({ commentLoading: true });
    try {
      const { videoId, commentPage, commentPageSize } = this.data;
      const res = await db.collection('comment')
        .where({ videoId })
        .orderBy('createTime', 'desc')
        .skip(commentPage * commentPageSize)
        .limit(commentPageSize)
        .get();

      const list = res.data.map(c => ({
        ...c,
        createTimeText: formatTime(c.createTime)
      }));

      this.setData({
        comments: reset ? list : [...this.data.comments, ...list],
        commentPage: commentPage + 1,
        commentHasMore: res.data.length === commentPageSize,
        commentLoading: false
      });
    } catch (e) {
      console.error('加载评论失败', e);
      this.setData({ commentLoading: false });
    }
  },

  onCommentInput(e) {
    this.setData({ commentInput: e.detail.value });
  },

  /**
   * 发布评论
   */
  async submitComment() {
    const content = this.data.commentInput.trim();
    if (!content) {
      wx.showToast({ title: '请输入评论内容', icon: 'none' });
      return;
    }
    if (!this.data.openid) {
      wx.showToast({ title: '请稍候，正在登录', icon: 'none' });
      return;
    }

    const app = getApp();
    const userInfo = app.globalData.userInfo;
    try {
      await db.collection('comment').add({
        data: {
          videoId: this.data.videoId,
          content,
          openid: this.data.openid,
          authorName: userInfo?.nickName || '匿名用户',
          authorAvatar: userInfo?.avatarUrl || '',
          createTime: db.serverDate()
        }
      });

      // 更新视频评论数
      await db.collection('video').doc(this.data.videoId).update({
        data: { commentCount: db.command.inc(1) }
      });

      this.setData({ commentInput: '' });
      wx.showToast({ title: '评论成功', icon: 'success' });
      // 刷新评论
      this.loadComments(true);
    } catch (e) {
      console.error('发布评论失败', e);
      wx.showToast({ title: '发布失败', icon: 'none' });
    }
  }
});

// ========== 工具函数 ==========

function formatDuration(sec) {
  if (sec == null || isNaN(sec)) return '00:00';
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function formatTime(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
