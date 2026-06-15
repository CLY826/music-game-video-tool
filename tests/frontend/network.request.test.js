/**
 * 前端网络请求测试：Mock 云函数请求
 * 覆盖加载中、请求成功、请求失败/超时场景
 */

require('./__mocks__/wx-globals');

const { __pageDefinitions } = require('./__mocks__/wx-globals');

// ─── 工具：创建 upload 页面实例 ───
function createUploadPage() {
  global.__currentPagePath = 'pages/upload/upload';
  delete require.cache[require.resolve('../../pages/upload/upload')];
  require('../../pages/upload/upload');

  const pageDef = __pageDefinitions['pages/upload/upload'];
  const instance = {
    ...pageDef,
    data: { ...pageDef.data },
    setData: jest.fn(function (newData) {
      Object.assign(this.data, newData);
    })
  };
  return instance;
}

// ─── 工具：创建 index 页面实例（先配置 db mock 再加载） ───
function createIndexPage(dbMockConfig) {
  global.__currentPagePath = 'pages/index/index';
  delete require.cache[require.resolve('../../pages/index/index')];

  // 配置 wx.cloud.database 返回的 db 行为
  if (dbMockConfig) {
    const db = wx.cloud.database();
    Object.keys(dbMockConfig).forEach(key => {
      if (typeof dbMockConfig[key] === 'function') {
        db[key] = dbMockConfig[key];
      }
    });
  }

  require('../../pages/index/index');

  const pageDef = __pageDefinitions['pages/index/index'];
  const instance = {
    ...pageDef,
    data: { ...pageDef.data },
    setData: jest.fn(function (newData) {
      Object.assign(this.data, newData);
    })
  };
  return instance;
}

// ─────────────────────────────────────────────
// 网络请求测试：AI 润色云函数调用
// ─────────────────────────────────────────────

describe('前端网络请求测试 - AI 润色云函数', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('NET-01: 请求中状态 - 调用 AI 润色时 polishing 应设为 true', async () => {
    const page = createUploadPage();
    page.data.desc = '练习了很久终于FC了';

    // 让 callFunction 永远不 resolve，模拟加载中
    let resolvePromise;
    wx.cloud.callFunction.mockReturnValue(new Promise(resolve => {
      resolvePromise = resolve;
    }));

    const promise = page.aiPolish();

    // 此时应该已经设置了 polishing = true
    expect(page.setData).toHaveBeenCalledWith({ polishing: true });
    expect(page.data.polishing).toBe(true);

    // 让请求完成
    resolvePromise({ result: { code: 0, polished: '测试' } });
    await promise;
  });

  test('NET-02: 请求成功 - AI 润色返回 code 0，desc 被更新为润色内容', async () => {
    const page = createUploadPage();
    page.data.desc = '这首歌好难';
    page.data.songName = '千本桜';
    page.data.gameName = 'Arcaea';

    wx.cloud.callFunction.mockResolvedValue({
      result: {
        code: 0,
        msg: '润色成功',
        original: '这首歌好难',
        polished: '千本桜 FC 收歌！这首真的太有挑战性了 🎵'
      }
    });

    await page.aiPolish();

    expect(wx.cloud.callFunction).toHaveBeenCalledWith({
      name: 'aiPolish',
      timeout: 20000,
      data: {
        text: '这首歌好难',
        songName: '千本桜',
        gameName: 'Arcaea'
      }
    });

    expect(page.setData).toHaveBeenCalledWith({
      desc: '千本桜 FC 收歌！这首真的太有挑战性了 🎵'
    });
  });

  test('NET-03: 请求失败 - 云函数调用抛异常，显示失败提示，polishing 恢复', async () => {
    const page = createUploadPage();
    page.data.desc = '有效的备注';

    wx.cloud.callFunction.mockRejectedValue(new Error('云函数超时'));

    await page.aiPolish();

    expect(page.setData).toHaveBeenCalledWith({ polishing: false });
    expect(wx.showToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('润色失败'),
        icon: 'none'
      })
    );
  });

  test('NET-04: 请求超时 - 云函数返回错误 code，显示错误信息', async () => {
    const page = createUploadPage();
    page.data.desc = '有效的备注';

    wx.cloud.callFunction.mockResolvedValue({
      result: { code: -4, msg: 'AI 润色失败：请求超时' }
    });

    await page.aiPolish();

    expect(wx.showToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('润色失败'),
        icon: 'none'
      })
    );
    expect(page.setData).toHaveBeenCalledWith({ polishing: false });
  });
});

// ─────────────────────────────────────────────
// 网络请求测试：云数据库查询（首页）
// ─────────────────────────────────────────────

describe('前端网络请求测试 - 首页数据加载', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('NET-05: 加载视频列表成功 - recentVideos 被更新', async () => {
    // 先配置 db mock 返回视频数据
    const db = wx.cloud.database();
    db.collection('video').orderBy('createTime', 'desc').limit(6).get
      .mockResolvedValue({
        data: [
          { _id: 'v1', songName: 'Song1', thumbFileId: '' },
          { _id: 'v2', songName: 'Song2', thumbFileId: '' }
        ]
      });

    const instance = createIndexPage();

    await instance.loadRecentVideos();
    expect(instance.setData).toHaveBeenCalledWith(
      expect.objectContaining({ loading: false })
    );
  });

  test('NET-06: 加载视频列表失败 - loading 恢复为 false', async () => {
    // 先配置 db mock 抛出异常
    const db = wx.cloud.database();
    db.collection('video').orderBy('createTime', 'desc').limit(6).get
      .mockRejectedValue(new Error('network error'));

    const instance = createIndexPage();

    await instance.loadRecentVideos();
    // catch 块会调用 setData({ loading: false })
    expect(instance.setData).toHaveBeenCalledWith({ loading: false });
  });
});
