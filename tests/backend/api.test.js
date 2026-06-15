/**
 * 接口测试：后端云函数调用接口
 * 覆盖所有云函数的正常请求、参数缺失、参数非法、请求失败等场景
 * wx-server-sdk 由 jest config moduleNameMapper 映射
 * https 模块在 aiPolish 接口测试中 mock
 */

jest.mock('https', () => ({ request: jest.fn() }));

const mockCloud = require('wx-server-sdk');
const https = require('https');

const aiPolish = require('../../cloudfunctions/aiPolish/index');
const addComment = require('../../cloudfunctions/addComment/index');
const getVideos = require('../../cloudfunctions/getVideos/index');
const getComments = require('../../cloudfunctions/getComments/index');

// 工具：设置 AI 接口 mock 成功响应
function setupAiSuccess(content) {
  const { EventEmitter } = require('events');
  const res = new EventEmitter();
  const req = new EventEmitter();
  req.write = jest.fn();
  req.end = jest.fn(() => {
    setImmediate(() => {
      res.emit('data', JSON.stringify({ choices: [{ message: { content } }] }));
      res.emit('end');
    });
  });
  req.setTimeout = jest.fn();
  req.destroy = jest.fn();
  https.request.mockImplementation((options, callback) => { callback(res); return req; });
}

// 工具：设置 AI 接口 mock 失败响应
function setupAiError(errorMessage) {
  const { EventEmitter } = require('events');
  const req = new EventEmitter();
  req.write = jest.fn();
  req.end = jest.fn(() => {
    setImmediate(() => req.emit('error', new Error(errorMessage)));
  });
  req.setTimeout = jest.fn();
  req.destroy = jest.fn();
  https.request.mockImplementation(() => req);
}

// 工具：设置 AI 接口返回 error JSON
function setupAiApiError(msg) {
  const { EventEmitter } = require('events');
  const res = new EventEmitter();
  const req = new EventEmitter();
  req.write = jest.fn();
  req.end = jest.fn(() => {
    setImmediate(() => {
      res.emit('data', JSON.stringify({ error: { message: msg } }));
      res.emit('end');
    });
  });
  req.setTimeout = jest.fn();
  req.destroy = jest.fn();
  https.request.mockImplementation((options, callback) => { callback(res); return req; });
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────
describe('接口测试 - aiPolish', () => {
  test('IT-01: 正常请求 - text/songName/gameName 均提供，返回 code 0 和润色内容', async () => {
    setupAiSuccess('AI润色后，这首千本桜真的太难了 🎵');
    const result = await aiPolish.main({
      text: '这首歌太难了，练了好久',
      songName: '千本桜',
      gameName: 'Arcaea'
    });
    expect(result.code).toBe(0);
    expect(typeof result.polished).toBe('string');
    expect(result.polished.length).toBeGreaterThan(0);
    expect(result.original).toBe('这首歌太难了，练了好久');
  });

  test('IT-02: 参数缺失 - text 为空，返回 code -1', async () => {
    const result = await aiPolish.main({ songName: '千本桜' });
    expect(result.code).toBe(-1);
    expect(https.request).not.toHaveBeenCalled();
  });

  test('IT-03: 参数非法 - text 仅含空格，返回 code -1', async () => {
    const result = await aiPolish.main({ text: '    ' });
    expect(result.code).toBe(-1);
  });

  test('IT-04: 外部 AI 请求失败 - 网络错误，返回 code -4', async () => {
    setupAiError('ECONNREFUSED');
    const result = await aiPolish.main({ text: '有效内容' });
    expect(result.code).toBe(-4);
    expect(result.msg).toContain('ECONNREFUSED');
  });

  test('IT-05: AI 返回错误响应（error 字段），返回 code -2', async () => {
    setupAiApiError('Rate limit exceeded');
    const result = await aiPolish.main({ text: '有效内容' });
    expect(result.code).toBe(-2);
    expect(result.msg).toContain('Rate limit exceeded');
  });
});

// ─────────────────────────────────────────────
describe('接口测试 - addComment', () => {
  test('IT-06: 正常请求 - videoId 和 content 均合法，返回 code 0 和新评论 id', async () => {
    const db = mockCloud.database();
    db.collection('comment').add.mockResolvedValue({ _id: 'cmt_001' });
    db.collection('video').doc().update.mockResolvedValue({ stats: { updated: 1 } });

    const result = await addComment.main({
      videoId: 'video001',
      content: '这个练法太强了！',
      authorName: '玩家小明'
    });
    expect(result.code).toBe(0);
    expect(result.id).toBe('cmt_001');
  });

  test('IT-07: 参数缺失 - 缺少 videoId，返回 code -1', async () => {
    const result = await addComment.main({ content: '好厉害' });
    expect(result.code).toBe(-1);
    expect(result.message).toMatch(/参数不完整/);
  });

  test('IT-08: 参数非法 - content 超过 500 字，返回 code -1', async () => {
    const result = await addComment.main({ videoId: 'video001', content: 'A'.repeat(501) });
    expect(result.code).toBe(-1);
    expect(result.message).toMatch(/500字/);
  });

  test('IT-09: 数据库写入异常，返回 code -1 和错误信息', async () => {
    const db = mockCloud.database();
    db.collection('comment').add.mockRejectedValue(new Error('write permission denied'));

    const result = await addComment.main({ videoId: 'video001', content: '正常评论' });
    expect(result.code).toBe(-1);
    expect(result.message).toBe('write permission denied');
  });
});

// ─────────────────────────────────────────────
describe('接口测试 - getVideos', () => {
  test('IT-10: 正常请求 - 无参数时返回最新视频列表', async () => {
    const db = mockCloud.database();
    db.collection('video').get.mockResolvedValue({
      data: [{ _id: 'v1', songName: 'Test Song', gameId: 'g1' }]
    });
    db.collection('video').count.mockResolvedValue({ total: 1 });

    const result = await getVideos.main({});
    expect(result.code).toBe(0);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.total).toBe(1);
  });

  test('IT-11: 请求失败 - 数据库异常，返回 code -1', async () => {
    const db = mockCloud.database();
    db.collection('video').get.mockRejectedValue(new Error('network timeout'));
    db.collection('video').count.mockRejectedValue(new Error('network timeout'));

    const result = await getVideos.main({});
    expect(result.code).toBe(-1);
    expect(result.message).toBe('network timeout');
  });
});

// ─────────────────────────────────────────────
describe('接口测试 - getComments', () => {
  test('IT-12: 正常请求 - 返回评论列表', async () => {
    const db = mockCloud.database();
    db.collection('comment').get.mockResolvedValue({
      data: [{ _id: 'c1', content: 'GG！', videoId: 'v001' }]
    });

    const result = await getComments.main({ videoId: 'v001' });
    expect(result.code).toBe(0);
    expect(result.data).toHaveLength(1);
  });

  test('IT-13: 参数缺失 - videoId 为空，返回 code -1', async () => {
    const result = await getComments.main({});
    expect(result.code).toBe(-1);
  });
});
