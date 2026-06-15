// pages/upload/upload.js - 视频上传页
const app = getApp();
const db = wx.cloud.database();

Page({
  data: {
    // 表单数据
    songName: '',
    gameName: '',
    gameId: '',
    desc: '',
    // 选中的视频信息
    videoSrc: '',       // 本地临时路径
    videoName: '',      // 原文件名
    videoSize: 0,       // 文件大小(bytes)
    videoSizeMB: '0.0', // 文件大小(MB)，格式化后用于展示
    videoDuration: 0,   // 时长(秒)
    thumbSrc: '',       // 封面临时路径
    // 音游列表（供选择器用）
    games: [],
    gameIndex: 0,
    gameRange: [],
    // 上传状态
    uploading: false,
    uploadProgress: 0,
    uploadStep: '',      // 'video' | 'thumb' | 'db'
    // AI 润色状态
    polishing: false
  },

  onLoad() {
    this.loadGames();
  },

  /**
   * 从 game 集合拉取分类
   */
  async loadGames() {
    const res = await db.collection('game').orderBy('sort', 'asc').get();
    const games = res.data;
    this.setData({
      games,
      gameRange: games.map(g => g.name),
      gameName: games[0]?.name || '',
      gameId: games[0]?._id || ''
    });
  },

  /**
   * 选择音游分类
   */
  onGameChange(e) {
    const idx = e.detail.value;
    const game = this.data.games[idx];
    this.setData({
      gameIndex: idx,
      gameName: game.name,
      gameId: game._id
    });
  },

  onSongNameInput(e) {
    this.setData({ songName: e.detail.value });
  },

  onDescInput(e) {
    this.setData({ desc: e.detail.value });
  },

  /**
   * AI 润色备注说明
   */
  async aiPolish() {
    const { desc, songName, gameName } = this.data;
    if (!desc || !desc.trim()) {
      wx.showToast({ title: '请先输入备注内容', icon: 'none' });
      return;
    }
    if (this.data.polishing) return;

    this.setData({ polishing: true });
    try {
      const res = await wx.cloud.callFunction({
        name: 'aiPolish',
        timeout: 20000,   // 等待云函数最多 20 秒
        data: {
          text: desc.trim(),
          songName: songName || '',
          gameName: gameName || ''
        }
      });

      const result = res.result;
      if (result && result.code === 0 && result.polished) {
        this.setData({ desc: result.polished });
        wx.showToast({ title: '润色完成 ✨', icon: 'success' });
      } else {
        wx.showToast({ title: result?.msg || '润色失败', icon: 'none' });
      }
    } catch (e) {
      console.error('AI 润色失败', e);
      wx.showToast({ title: '润色失败，请重试', icon: 'none' });
    } finally {
      this.setData({ polishing: false });
    }
  },

  /**
   * 选择本地视频
   */
  chooseVideo() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['video'],
      sourceType: ['album'],   // 只允许从相册选，不录制
      maxDuration: 600,        // 最长 10 分钟
      success: res => {
        const item = res.tempFiles[0];
        this.setData({
          videoSrc: item.tempFilePath,
          videoDuration: Math.round(item.duration),
          videoSize: item.size,
          videoSizeMB: (item.size / 1024 / 1024).toFixed(1),
          thumbSrc: item.thumbTempFilePath || ''
        });
      }
    });
  },

  /**
   * 表单验证
   */
  validate() {
    if (!this.data.songName.trim()) {
      wx.showToast({ title: '请输入歌曲名称', icon: 'none' });
      return false;
    }
    if (!this.data.videoSrc) {
      wx.showToast({ title: '请选择要上传的视频', icon: 'none' });
      return false;
    }
    return true;
  },

  /**
   * 执行上传
   * 步骤：① 上传视频到云存储 → ② 上传封面到云存储 → ③ 写入 video 集合
   */
  async doUpload() {
    if (!this.validate()) return;
    if (this.data.uploading) return;

    this.setData({ uploading: true, uploadProgress: 0, uploadStep: 'video' });

    try {
      const openid = await this.getOpenid();
      const ts = Date.now();
      const videoExt = this.data.videoSrc.split('.').pop() || 'mp4';
      const cloudVideoPath = `videos/${openid}/${ts}.${videoExt}`;

      // ① 上传视频
      wx.showLoading({ title: '上传视频中...', mask: true });
      const videoRes = await new Promise((resolve, reject) => {
        wx.cloud.uploadFile({
          cloudPath: cloudVideoPath,
          filePath: this.data.videoSrc,
          success: resolve,
          fail: reject
        });
      });
      const videoFileId = videoRes.fileID;

      // ② 上传封面（如有）
      let thumbFileId = '';
      if (this.data.thumbSrc) {
        this.setData({ uploadStep: 'thumb', uploadProgress: 60 });
        const thumbExt = this.data.thumbSrc.split('.').pop() || 'jpg';
        const cloudThumbPath = `thumbs/${openid}/${ts}.${thumbExt}`;
        const thumbRes = await new Promise((resolve, reject) => {
          wx.cloud.uploadFile({
            cloudPath: cloudThumbPath,
            filePath: this.data.thumbSrc,
            success: resolve,
            fail: reject
          });
        });
        thumbFileId = thumbRes.fileID;
      }

      // ③ 写入 video 集合（只存 fileId，不存会过期的临时链接）
      this.setData({ uploadStep: 'db', uploadProgress: 90 });
      const userInfo = app.globalData.userInfo;
      await db.collection('video').add({
        data: {
          songName: this.data.songName.trim(),
          gameId: this.data.gameId,
          gameName: this.data.gameName,
          gameColor: this.data.games[this.data.gameIndex]?.color || '#6c63ff',
          desc: this.data.desc.trim(),
          videoFileId,
          videoUrl: '',    // 不存临时链接，播放时动态获取
          thumbFileId,
          thumbUrl: '',    // 不存临时链接，展示时动态获取
          duration: this.data.videoDuration,
          durationText: formatDuration(this.data.videoDuration),
          fileSize: this.data.videoSize,
          openid,
          uploaderName: userInfo?.nickName || '匿名用户',
          uploaderAvatar: userInfo?.avatarUrl || '',
          commentCount: 0,
          createTime: db.serverDate()
        }
      });

      // ⑤ 更新 game 集合中的 videoCount
      await db.collection('game').doc(this.data.gameId).update({
        data: { videoCount: db.command.inc(1) }
      });

      wx.hideLoading();
      this.setData({ uploading: false, uploadProgress: 100 });
      wx.showToast({ title: '上传成功！', icon: 'success' });

      // 延迟跳回首页
      setTimeout(() => wx.navigateBack(), 1500);
    } catch (e) {
      wx.hideLoading();
      console.error('上传失败', e);
      this.setData({ uploading: false });
      wx.showToast({ title: '上传失败：' + (e.errMsg || '未知错误'), icon: 'none', duration: 3000 });
    }
  },

  /**
   * 获取当前用户 openid（等待登录完成）
   */
  getOpenid() {
    return new Promise(resolve => {
      app.getOpenid(resolve);
    });
  }
});

function formatDuration(sec) {
  if (!sec) return '00:00';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
