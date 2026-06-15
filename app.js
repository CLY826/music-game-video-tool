// app.js - 小程序入口，初始化云开发环境
App({
  onLaunch: function () {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        // 替换为你的云开发环境 ID（在微信开发者工具 -> 云开发控制台 查看）
        env: 'cloud1-d5g80cjzo4df8c3c8',
        traceUser: true,
      });
      console.log('云开发初始化成功');
    }

    // 登录并获取用户信息
    this.login();
  },

  /**
   * 用户登录，调用云函数获取 openid 并写入 user 集合
   */
  login() {
    wx.cloud.callFunction({
      name: 'login',
      success: res => {
        console.log('登录成功', res.result);
        // 将用户信息存储到全局
        this.globalData.openid = res.result.openid;
        this.globalData.userInfo = res.result.userInfo || null;

        // 通知等待登录完成的回调
        if (this.globalData.loginCallback) {
          this.globalData.loginCallback(res.result.openid);
        }
      },
      fail: err => {
        console.error('登录失败', err);
      }
    });
  },

  /**
   * 获取当前登录用户的 openid
   * 若尚未登录完成，等待回调
   */
  getOpenid(cb) {
    if (this.globalData.openid) {
      cb(this.globalData.openid);
    } else {
      this.globalData.loginCallback = cb;
    }
  },

  globalData: {
    openid: null,
    userInfo: null,
    loginCallback: null,
    // 云开发环境 ID，与上方 wx.cloud.init 保持一致
    envId: 'cloud1-d5g80cjzo4df8c3c8',
    // 预设音游分类列表（同时也写入 game 集合）
    defaultGames: [
      { name: 'Phigros', icon: '🎵', color: '#6c63ff' },
      { name: 'Arcaea', icon: '🌸', color: '#e91e8c' },
      { name: 'Cytus II', icon: '🎭', color: '#00bcd4' },
      { name: 'Malody', icon: '🎸', color: '#ff9800' },
      { name: 'Lanota', icon: '🌊', color: '#4caf50' },
      { name: 'Dynamix', icon: '⚡', color: '#f44336' },
      { name: '其他', icon: '🎮', color: '#9e9e9e' }
    ]
  }
});
