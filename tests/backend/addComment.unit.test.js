/**
 * 单元测试：addComment 云函数 - 核心业务逻辑
 * wx-server-sdk 由 jest config moduleNameMapper 映射为 mock
 * 只校验参数验证、评论长度限制等业务逻辑
 */

const mockCloud = require('wx-server-sdk');

// 加载被测模块
const addComment = require('../../cloudfunctions/addComment/index');

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────
describe('addComment 单元测试 - 参数校验', () => {
  test('UT-11: videoId 缺失时返回 code -1', async () => {
    const result = await addComment.main({ content: '好厉害！' });
    expect(result.code).toBe(-1);
    expect(result.message).toMatch(/参数不完整/);
  });

  test('UT-12: content 缺失时返回 code -1', async () => {
    const result = await addComment.main({ videoId: 'v001' });
    expect(result.code).toBe(-1);
    expect(result.message).toMatch(/参数不完整/);
  });

  test('UT-13: content 为空字符串时返回 code -1', async () => {
    const result = await addComment.main({ videoId: 'v001', content: '   ' });
    expect(result.code).toBe(-1);
    expect(result.message).toMatch(/参数不完整/);
  });

  test('UT-14: content 超过 500 字时返回 code -1', async () => {
    const longContent = '啊'.repeat(501);
    const result = await addComment.main({ videoId: 'v001', content: longContent });
    expect(result.code).toBe(-1);
    expect(result.message).toMatch(/不能超过500字/);
  });

  test('UT-15: content 恰好 500 字时不应被拦截（边界值测试）', async () => {
    const db = mockCloud.database();
    db.collection('comment').add.mockResolvedValue({ _id: 'c_new' });
    db.collection('video').doc().update.mockResolvedValue({ stats: { updated: 1 } });

    const content500 = '啊'.repeat(500);
    const result = await addComment.main({ videoId: 'v001', content: content500 });
    expect(result.code).toBe(0);
  });
});

// ─────────────────────────────────────────────
describe('addComment 单元测试 - 正常写入', () => {
  test('UT-16: 参数合法时，成功写入评论并返回 code 0 和 id', async () => {
    const db = mockCloud.database();
    db.collection('comment').add.mockResolvedValue({ _id: 'comment_new_id' });
    db.collection('video').doc().update.mockResolvedValue({ stats: { updated: 1 } });

    const result = await addComment.main({
      videoId: 'v001',
      content: 'FC了！太强了',
      authorName: '玩家A',
      authorAvatar: 'https://avatar.com/a.png'
    });
    expect(result.code).toBe(0);
    expect(result.id).toBe('comment_new_id');
  });
});

// ─────────────────────────────────────────────
describe('addComment 单元测试 - 异常处理', () => {
  test('UT-17: 数据库写入异常时，返回 code -1 和错误信息', async () => {
    const db = mockCloud.database();
    db.collection('comment').add.mockRejectedValue(new Error('DB write failed'));

    const result = await addComment.main({
      videoId: 'v001',
      content: '正常评论'
    });
    expect(result.code).toBe(-1);
    expect(result.message).toBe('DB write failed');
  });
});
