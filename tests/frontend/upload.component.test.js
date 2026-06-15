/**
 * 前端组件测试：upload 上传页面
 * 测试渲染逻辑、交互事件处理
 * Mock 了 wx 全局 API、getApp()、Page()
 */

// 加载 wx 全局 mock
require('./__mocks__/wx-globals');

// ─── 工具函数：加载页面定义并创建实例 ───

/**
 * 加载页面 JS 文件，捕获 Page() 传入的定义，返回实例化的页面对象
 */
function createPageInstance(pagePath) {
  // 设置当前页面路径（供 Page mock 记录）
  global.__currentPagePath = pagePath;

  // 清除 require 缓存，确保重新执行
  delete require.cache[require.resolve('../../pages/upload/upload')];

  // 执行页面 JS（触发 Page() 调用）
  require('../../pages/upload/upload');

  // 取出 Page 定义
  const { __pageDefinitions } = require('./__mocks__/wx-globals');
  const pageDef = __pageDefinitions[pagePath];
  if (!pageDef) throw new Error(`Page definition not found for ${pagePath}`);

  // 创建实例：将 data 和方法绑定到同一对象
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
// 组件测试：上传页面数据初始化
// ─────────────────────────────────────────────

describe('upload 页面组件测试 - 数据初始化', () => {
  test('CT-01: 页面初始数据字段完整', () => {
    const page = createPageInstance('pages/upload/upload');
    expect(page.data).toHaveProperty('songName', '');
    expect(page.data).toHaveProperty('gameName', '');
    expect(page.data).toHaveProperty('desc', '');
    expect(page.data).toHaveProperty('videoSrc', '');
    expect(page.data).toHaveProperty('uploading', false);
    expect(page.data).toHaveProperty('polishing', false);
  });
});

// ─────────────────────────────────────────────
// 组件测试：输入交互
// ─────────────────────────────────────────────

describe('upload 页面组件测试 - 输入交互', () => {
  test('CT-02: onSongNameInput 更新 songName', () => {
    const page = createPageInstance('pages/upload/upload');
    page.onSongNameInput({ detail: { value: '千本桜' } });
    expect(page.setData).toHaveBeenCalledWith({ songName: '千本桜' });
  });

  test('CT-03: onDescInput 更新 desc', () => {
    const page = createPageInstance('pages/upload/upload');
    page.onDescInput({ detail: { value: '今天练习了这首歌' } });
    expect(page.setData).toHaveBeenCalledWith({ desc: '今天练习了这首歌' });
  });
});

// ─────────────────────────────────────────────
// 组件测试：音游分类选择交互
// ─────────────────────────────────────────────

describe('upload 页面组件测试 - 音游选择交互', () => {
  test('CT-04: onGameChange 选择不同音游时更新 gameName 和 gameId', () => {
    const page = createPageInstance('pages/upload/upload');
    // 模拟 loadGames 后的数据
    page.data.games = [
      { _id: 'g1', name: 'Arcaea' },
      { _id: 'g2', name: 'Phigros' },
      { _id: 'g3', name: 'CHUNITHM' }
    ];

    page.onGameChange({ detail: { value: 2 } });
    expect(page.setData).toHaveBeenCalledWith({
      gameIndex: 2,
      gameName: 'CHUNITHM',
      gameId: 'g3'
    });
  });
});

// ─────────────────────────────────────────────
// 组件测试：表单验证交互
// ─────────────────────────────────────────────

describe('upload 页面组件测试 - 表单验证', () => {
  test('CT-05: songName 为空时 validate 返回 false 并提示', () => {
    const page = createPageInstance('pages/upload/upload');
    page.data.songName = '';
    page.data.videoSrc = 'temp://video.mp4';

    const result = page.validate();
    expect(result).toBe(false);
    expect(wx.showToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringContaining('歌曲名称') })
    );
  });

  test('CT-06: videoSrc 为空时 validate 返回 false 并提示', () => {
    const page = createPageInstance('pages/upload/upload');
    page.data.songName = '千本桜';
    page.data.videoSrc = '';

    const result = page.validate();
    expect(result).toBe(false);
    expect(wx.showToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringContaining('视频') })
    );
  });

  test('CT-07: songName 和 videoSrc 均有值时 validate 返回 true', () => {
    const page = createPageInstance('pages/upload/upload');
    page.data.songName = '千本桜';
    page.data.videoSrc = 'temp://video.mp4';

    const result = page.validate();
    expect(result).toBe(true);
  });
});

// ─────────────────────────────────────────────
// 组件测试：AI 润色按钮交互
// ─────────────────────────────────────────────

describe('upload 页面组件测试 - AI 润色交互', () => {
  test('CT-08: desc 为空时点击 AI 润色，提示用户先输入内容', async () => {
    const page = createPageInstance('pages/upload/upload');
    page.data.desc = '';

    await page.aiPolish();
    expect(wx.showToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringContaining('请先输入') })
    );
    expect(wx.cloud.callFunction).not.toHaveBeenCalled();
  });

  test('CT-09: polishing 为 true 时点击 AI 润色，不重复请求', async () => {
    const page = createPageInstance('pages/upload/upload');
    page.data.desc = '有效内容';
    page.data.polishing = true;

    await page.aiPolish();
    expect(wx.cloud.callFunction).not.toHaveBeenCalled();
  });

  test('CT-10: AI 润色成功时更新 desc 并显示成功提示', async () => {
    const page = createPageInstance('pages/upload/upload');
    page.data.desc = '今天练了很久';
    page.data.songName = '千本桜';
    page.data.gameName = 'Arcaea';

    wx.cloud.callFunction.mockResolvedValue({
      result: { code: 0, polished: '润色后的内容 ✨' }
    });

    await page.aiPolish();
    expect(page.setData).toHaveBeenCalledWith({ polishing: true });
    expect(page.setData).toHaveBeenCalledWith({ desc: '润色后的内容 ✨' });
    expect(page.setData).toHaveBeenCalledWith({ polishing: false });
    expect(wx.showToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringContaining('润色完成') })
    );
  });

  test('CT-11: AI 润色失败时显示错误提示，polishing 恢复为 false', async () => {
    const page = createPageInstance('pages/upload/upload');
    page.data.desc = '有效内容';

    wx.cloud.callFunction.mockRejectedValue(new Error('timeout'));

    await page.aiPolish();
    expect(page.setData).toHaveBeenCalledWith({ polishing: false });
    expect(wx.showToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringContaining('润色失败') })
    );
  });
});
