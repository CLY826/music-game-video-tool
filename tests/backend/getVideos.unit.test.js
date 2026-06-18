/**
 * 单元测试：getVideos 云函数 - 核心业务逻辑
 * wx-server-sdk 由 jest config moduleNameMapper 映射为 mock
 * 只校验分类过滤、分页逻辑
 */

const mockCloud = require('wx-server-sdk');
const getVideos = require('../../cloudfunctions/getVideos/index');

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────
describe('getVideos 单元测试 - 分页查询', () => {
  test('UT-18: 默认参数查询成功，返回 code 0', async () => {
    const db = mockCloud.database();
    db.collection('video').get.mockResolvedValue({ data: [{ _id: 'v1', songName: 'Song1' }] });
    db.collection('video').count.mockResolvedValue({ total: 1 });

    const result = await getVideos.main({});
    expect(result.code).toBe(0);
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  test('UT-19: pageSize 条数据恰好等于 pageSize 时 hasMore 为 true', async () => {
    const db = mockCloud.database();
    const videos = Array.from({ length: 10 }, (_, i) => ({ _id: `v${i}` }));
    db.collection('video').get.mockResolvedValue({ data: videos });
    db.collection('video').count.mockResolvedValue({ total: 25 });

    const result = await getVideos.main({ pageSize: 10 });
    expect(result.hasMore).toBe(true);
  });

  test('UT-20: 返回数据不足 pageSize 时 hasMore 为 false', async () => {
    const db = mockCloud.database();
    db.collection('video').get.mockResolvedValue({ data: [{ _id: 'v1' }] });
    db.collection('video').count.mockResolvedValue({ total: 1 });

    const result = await getVideos.main({ pageSize: 10 });
    expect(result.hasMore).toBe(false);
  });

  test('UT-21: sortBy 为 songName 时排序方向为 asc', async () => {
    const db = mockCloud.database();
    db.collection('video').get.mockResolvedValue({ data: [] });
    db.collection('video').count.mockResolvedValue({ total: 0 });

    await getVideos.main({ sortBy: 'songName' });
    expect(db.collection('video').orderBy).toHaveBeenCalledWith('songName', 'asc');
  });
});

// ─────────────────────────────────────────────
describe('getVideos 单元测试 - 异常处理', () => {
  test('UT-22: 数据库查询异常时，返回通用错误提示（不暴露内部细节）', async () => {
    const db = mockCloud.database();
    db.collection('video').get.mockRejectedValue(new Error('DB connection lost'));
    db.collection('video').count.mockRejectedValue(new Error('DB connection lost'));

    const result = await getVideos.main({});
    expect(result.code).toBe(-1);
    expect(result.message).toBe('查询服务暂时不可用');
  });
});
