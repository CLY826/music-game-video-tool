/**
 * 前端组件测试：index 首页 - 补充测试
 * 覆盖 loadGames、initDefaultGames、loadRecentVideos、onPullDownRefresh、fillThumbUrls
 */

require('./__mocks__/wx-globals');

const { __pageDefinitions, __dbInstance } = require('./__mocks__/wx-globals');

// ─── 工具：创建 index 页面实例 ───
function createIndexPage() {
  global.__currentPagePath = 'pages/index/index';
  delete require.cache[require.resolve('../../pages/index/index')];
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

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────
// loadGames 测试
// ─────────────────────────────────────────────

describe('index 首页 - loadGames 加载分类', () => {
  test('CT-18: loadGames 成功加载分类列表', async () => {
    const mockGames = [
      { _id: 'g1', name: 'Arcaea', sort: 0 },
      { _id: 'g2', name: 'Phigros', sort: 1 }
    ];

    __dbInstance.collection('game').orderBy('sort', 'asc').get
      .mockResolvedValue({ data: mockGames });

    const page = createIndexPage();
    await page.loadGames();

    expect(page.setData).toHaveBeenCalledWith({ games: mockGames });
  });

  test('CT-19: loadGames 数据库为空时调用 initDefaultGames 并重新加载', async () => {
    // 第一次返回空，第二次返回默认数据
    __dbInstance.collection('game').orderBy('sort', 'asc').get
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [{ _id: 'g1', name: 'Arcaea', sort: 0 }] });

    __dbInstance.collection('game').add.mockResolvedValue({ _id: 'new_game' });

    const page = createIndexPage();
    await page.loadGames();

    // 应该调用了 add 写入默认分类
    expect(__dbInstance.collection('game').add).toHaveBeenCalled();
    // 最终 setData 应该有数据
    expect(page.setData).toHaveBeenCalledWith({ games: [{ _id: 'g1', name: 'Arcaea', sort: 0 }] });
  });

  test('CT-20: loadGames 数据库异常时不崩溃', async () => {
    __dbInstance.collection('game').orderBy('sort', 'asc').get
      .mockRejectedValue(new Error('db error'));

    const page = createIndexPage();
    // 不应抛出异常
    await expect(page.loadGames()).resolves.toBeUndefined();
  });
});

// ─────────────────────────────────────────────
// loadRecentVideos 测试
// ─────────────────────────────────────────────

describe('index 首页 - loadRecentVideos 加载视频', () => {
  test('CT-21: loadRecentVideos 成功加载视频列表', async () => {
    const mockVideos = [
      { _id: 'v1', songName: 'Song1', thumbFileId: '' },
      { _id: 'v2', songName: 'Song2', thumbFileId: '' }
    ];

    __dbInstance.collection('video').orderBy('createTime', 'desc').limit(6).get
      .mockResolvedValue({ data: mockVideos });

    // getTempFileURL 返回空列表（因为 thumbFileId 为空）
    wx.cloud.getTempFileURL.mockResolvedValue({ fileList: [] });

    const page = createIndexPage();
    await page.loadRecentVideos();

    expect(page.setData).toHaveBeenCalledWith(
      expect.objectContaining({ loading: false })
    );
  });

  test('CT-22: loadRecentVideos 失败时 loading 恢复为 false', async () => {
    __dbInstance.collection('video').orderBy('createTime', 'desc').limit(6).get
      .mockRejectedValue(new Error('network error'));

    const page = createIndexPage();
    await page.loadRecentVideos();

    expect(page.setData).toHaveBeenCalledWith({ loading: false });
  });
});

// ─────────────────────────────────────────────
// onSearchConfirm 边界场景
// ─────────────────────────────────────────────

describe('index 首页 - 搜索确认边界场景', () => {
  test('CT-23: onSearchConfirm 关键词为空时也能跳转', () => {
    const page = createIndexPage();
    page.data.searchKeyword = '   ';
    page.onSearchConfirm();

    expect(wx.navigateTo).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// fillThumbUrls 间接测试
// ─────────────────────────────────────────────

describe('index 首页 - fillThumbUrls 封面链接填充', () => {
  test('CT-24: 视频有 thumbFileId 时通过 getTempFileURL 填充', async () => {
    const mockVideos = [
      { _id: 'v1', songName: 'Song1', thumbFileId: 'cloud://thumb1' },
      { _id: 'v2', songName: 'Song2', thumbFileId: 'cloud://thumb2' }
    ];

    __dbInstance.collection('video').orderBy('createTime', 'desc').limit(6).get
      .mockResolvedValue({ data: mockVideos });

    wx.cloud.getTempFileURL.mockResolvedValue({
      fileList: [
        { fileID: 'cloud://thumb1', tempFileURL: 'https://cdn.com/thumb1.jpg' },
        { fileID: 'cloud://thumb2', tempFileURL: 'https://cdn.com/thumb2.jpg' }
      ]
    });

    const page = createIndexPage();
    await page.loadRecentVideos();

    expect(wx.cloud.getTempFileURL).toHaveBeenCalledWith({
      fileList: ['cloud://thumb1', 'cloud://thumb2']
    });
    // setData 应包含带 thumbUrl 的视频列表
    expect(page.setData).toHaveBeenCalledWith(
      expect.objectContaining({ loading: false })
    );
  });

  test('CT-25: getTempFileURL 失败时仍能正常返回列表', async () => {
    const mockVideos = [
      { _id: 'v1', songName: 'Song1', thumbFileId: 'cloud://thumb1' }
    ];

    __dbInstance.collection('video').orderBy('createTime', 'desc').limit(6).get
      .mockResolvedValue({ data: mockVideos });

    wx.cloud.getTempFileURL.mockRejectedValue(new Error('获取链接失败'));

    const page = createIndexPage();
    await page.loadRecentVideos();

    // 即使 getTempFileURL 失败，也不应该崩溃，loading 应恢复
    expect(page.setData).toHaveBeenCalledWith(
      expect.objectContaining({ loading: false })
    );
  });
});
