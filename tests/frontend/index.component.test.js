/**
 * 前端组件测试：index 首页
 * 测试渲染逻辑、分类加载、视频加载、导航交互
 * Mock 了 wx 全局 API、getApp()、Page()
 */

require('./__mocks__/wx-globals');

const { __pageDefinitions } = require('./__mocks__/wx-globals');

function createPageInstance(pagePath) {
  global.__currentPagePath = pagePath;
  delete require.cache[require.resolve('../../pages/index/index')];
  require('../../pages/index/index');

  const pageDef = __pageDefinitions[pagePath];
  if (!pageDef) throw new Error(`Page definition not found for ${pagePath}`);

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
// 组件测试：首页数据初始化
// ─────────────────────────────────────────────

describe('index 首页组件测试 - 数据初始化', () => {
  test('CT-12: 页面初始数据字段完整', () => {
    const page = createPageInstance('pages/index/index');
    expect(page.data).toHaveProperty('games');
    expect(page.data).toHaveProperty('recentVideos');
    expect(page.data).toHaveProperty('loading', true);
    expect(page.data).toHaveProperty('searchKeyword', '');
  });
});

// ─────────────────────────────────────────────
// 组件测试：导航交互
// ─────────────────────────────────────────────

describe('index 首页组件测试 - 导航交互', () => {
  test('CT-13: onGameTap 跳转到分类页，携带 gameId 和 gameName', () => {
    const page = createPageInstance('pages/index/index');
    page.onGameTap({
      currentTarget: { dataset: { gameId: 'g001', gameName: 'Arcaea' } }
    });
    expect(wx.navigateTo).toHaveBeenCalledWith({
      url: '/pages/category/category?gameId=g001&gameName=Arcaea'
    });
  });

  test('CT-14: onVideoTap 跳转到播放页，携带 videoId', () => {
    const page = createPageInstance('pages/index/index');
    page.onVideoTap({
      currentTarget: { dataset: { videoId: 'v001' } }
    });
    expect(wx.navigateTo).toHaveBeenCalledWith({
      url: '/pages/player/player?videoId=v001'
    });
  });

  test('CT-15: onSearchConfirm 跳转到搜索页，携带关键词', () => {
    const page = createPageInstance('pages/index/index');
    page.data.searchKeyword = '千本桜';
    page.onSearchConfirm();
    expect(wx.navigateTo).toHaveBeenCalledWith({
      url: `/pages/search/search?keyword=${encodeURIComponent('千本桜')}`
    });
  });

  test('CT-16: goUpload 跳转到上传页', () => {
    const page = createPageInstance('pages/index/index');
    page.goUpload();
    expect(wx.navigateTo).toHaveBeenCalledWith({
      url: '/pages/upload/upload'
    });
  });
});

// ─────────────────────────────────────────────
// 组件测试：搜索框输入
// ─────────────────────────────────────────────

describe('index 首页组件测试 - 搜索交互', () => {
  test('CT-17: onSearchInput 更新 searchKeyword', () => {
    const page = createPageInstance('pages/index/index');
    page.onSearchInput({ detail: { value: 'Arcaea' } });
    expect(page.setData).toHaveBeenCalledWith({ searchKeyword: 'Arcaea' });
  });
});
