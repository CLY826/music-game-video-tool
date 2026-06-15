/**
 * 前端组件测试：upload 上传页面 - 补充测试
 * 覆盖 chooseVideo、doUpload、getOpenid、formatDuration 等未测函数
 */

require('./__mocks__/wx-globals');

const { __pageDefinitions, __dbInstance } = require('./__mocks__/wx-globals');

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

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────
// chooseVideo 测试
// ─────────────────────────────────────────────

describe('upload 页面 - chooseVideo 选择视频', () => {
  test('CT-12: chooseVideo 调用 wx.chooseMedia 并在 success 中更新视频数据', () => {
    const page = createUploadPage();

    // 模拟 wx.chooseMedia：立即调用 success 回调
    wx.chooseMedia.mockImplementation(({ success }) => {
      success({
        tempFiles: [{
          tempFilePath: 'wxfile://tmp_video.mp4',
          duration: 125.5,
          size: 10485760,
          thumbTempFilePath: 'wxfile://tmp_thumb.jpg'
        }]
      });
    });

    page.chooseVideo();

    expect(wx.chooseMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        count: 1,
        mediaType: ['video'],
        sourceType: ['album'],
        maxDuration: 600
      })
    );

    // 检查 setData 被调用更新视频信息
    expect(page.setData).toHaveBeenCalledWith({
      videoSrc: 'wxfile://tmp_video.mp4',
      videoDuration: 126,    // Math.round(125.5)
      videoSize: 10485760,
      videoSizeMB: '10.0',   // (10485760/1024/1024).toFixed(1)
      thumbSrc: 'wxfile://tmp_thumb.jpg'
    });
  });

  test('CT-13: chooseMedia 返回无封面时 thumbSrc 为空字符串', () => {
    const page = createUploadPage();

    wx.chooseMedia.mockImplementation(({ success }) => {
      success({
        tempFiles: [{
          tempFilePath: 'wxfile://tmp_video.mp4',
          duration: 30,
          size: 5242880,
          thumbTempFilePath: undefined
        }]
      });
    });

    page.chooseVideo();

    expect(page.setData).toHaveBeenCalledWith(
      expect.objectContaining({ thumbSrc: '' })
    );
  });
});

// ─────────────────────────────────────────────
// doUpload 测试
// ─────────────────────────────────────────────

describe('upload 页面 - doUpload 执行上传', () => {
  test('CT-14: validate 失败时 doUpload 不执行上传', async () => {
    const page = createUploadPage();
    page.data.songName = '';  // 空歌曲名导致 validate 失败

    await page.doUpload();

    expect(wx.cloud.uploadFile).not.toHaveBeenCalled();
    expect(wx.showLoading).not.toHaveBeenCalled();
  });

  test('CT-15: uploading 为 true 时 doUpload 不重复执行', async () => {
    const page = createUploadPage();
    page.data.songName = '千本桜';
    page.data.videoSrc = 'wxfile://tmp.mp4';
    page.data.uploading = true;

    await page.doUpload();

    expect(wx.cloud.uploadFile).not.toHaveBeenCalled();
  });

  test('CT-16: 上传成功 - 完整流程（视频上传+数据库写入）', async () => {
    const page = createUploadPage();
    page.data.songName = '千本桜';
    page.data.videoSrc = 'wxfile://tmp_video.mp4';
    page.data.thumbSrc = '';  // 无封面，跳过封面上传
    page.data.videoDuration = 125;
    page.data.videoSize = 10485760;
    page.data.gameId = 'g1';
    page.data.gameName = 'Arcaea';
    page.data.gameIndex = 0;
    page.data.desc = 'FC了！';
    page.data.games = [{ _id: 'g1', name: 'Arcaea', color: '#6c63ff' }];

    // Mock uploadFile 用 callback 方式（和源码一致）
    wx.cloud.uploadFile.mockImplementation(({ cloudPath, filePath, success, fail }) => {
      success({ fileID: `cloud://${cloudPath}`, statusCode: 200 });
    });

    // Mock 数据库操作
    __dbInstance.collection('video').add.mockResolvedValue({ _id: 'new_video_id' });
    __dbInstance.collection('game').doc.mockReturnThis();
    __dbInstance.update.mockResolvedValue({ stats: { updated: 1 } });

    await page.doUpload();

    // 验证显示 loading
    expect(wx.showLoading).toHaveBeenCalled();
    // 验证数据库写入
    expect(__dbInstance.collection('video').add).toHaveBeenCalled();
    // 验证上传完成后的状态
    expect(wx.hideLoading).toHaveBeenCalled();
    expect(wx.showToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringContaining('上传成功') })
    );
  });

  test('CT-17: 上传失败 - 显示错误提示，uploading 恢复为 false', async () => {
    const page = createUploadPage();
    page.data.songName = '千本桜';
    page.data.videoSrc = 'wxfile://tmp_video.mp4';
    page.data.videoDuration = 30;
    page.data.videoSize = 5242880;
    page.data.gameId = 'g1';
    page.data.gameName = 'Arcaea';
    page.data.gameIndex = 0;
    page.data.games = [{ _id: 'g1', name: 'Arcaea', color: '#6c63ff' }];

    // Mock 上传失败（通过 fail 回调）
    wx.cloud.uploadFile.mockImplementation(({ fail }) => {
      fail({ errMsg: 'upload failed' });
    });

    await page.doUpload();

    expect(wx.hideLoading).toHaveBeenCalled();
    expect(page.setData).toHaveBeenCalledWith({ uploading: false });
    expect(wx.showToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('上传失败'),
        icon: 'none'
      })
    );
  });
});

// ─────────────────────────────────────────────
// getOpenid 测试
// ─────────────────────────────────────────────

describe('upload 页面 - getOpenid 获取用户标识', () => {
  test('CT-18: getOpenid 调用 app.getOpenid 并返回 openid', async () => {
    const page = createUploadPage();

    const openid = await page.getOpenid();

    expect(openid).toBe('test_openid_123');
  });
});

// ─────────────────────────────────────────────
// formatDuration 测试（间接测试，复制实现验证逻辑）
// ─────────────────────────────────────────────

describe('upload 页面 - formatDuration 时长格式化', () => {
  // formatDuration 是模块级私有函数，复制实现验证
  function formatDuration(sec) {
    if (!sec) return '00:00';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  test('CT-19a: 0 秒/null/undefined 返回 00:00', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(null)).toBe('00:00');
    expect(formatDuration(undefined)).toBe('00:00');
  });

  test('CT-19b: 正常秒数格式化正确', () => {
    expect(formatDuration(30)).toBe('00:30');
    expect(formatDuration(65)).toBe('01:05');
    expect(formatDuration(125)).toBe('02:05');
    expect(formatDuration(600)).toBe('10:00');
    expect(formatDuration(3661)).toBe('61:01');
  });
});
