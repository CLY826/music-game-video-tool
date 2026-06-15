/**
 * 单元测试：getComments 云函数 - 核心业务逻辑
 * wx-server-sdk 由 jest config moduleNameMapper 映射为 mock
 * 只校验 videoId 必填校验和分页逻辑
 */

const mockCloud = require('wx-server-sdk');
const getComments = require('../../cloudfunctions/getComments/index');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getComments 单元测试 - 参数校验', () => {
  test('UT-23: videoId 缺失时返回 code -1', async () => {
    const result = await getComments.main({});
    expect(result.code).toBe(-1);
    expect(result.message).toMatch(/videoId/);
  });

  test('UT-24: videoId 为空字符串时返回 code -1', async () => {
    const result = await getComments.main({ videoId: '' });
    expect(result.code).toBe(-1);
  });
});

describe('getComments 单元测试 - 正常查询', () => {
  test('UT-25: videoId 合法时返回 code 0 和评论列表', async () => {
    const db = mockCloud.database();
    const mockComments = [
      { _id: 'c1', content: '太强了', videoId: 'v001' },
      { _id: 'c2', content: 'FC！', videoId: 'v001' }
    ];
    db.collection('comment').get.mockResolvedValue({ data: mockComments });

    const result = await getComments.main({ videoId: 'v001' });
    expect(result.code).toBe(0);
    expect(result.data).toHaveLength(2);
  });

  test('UT-26: 传入分页参数时正常返回', async () => {
    const db = mockCloud.database();
    db.collection('comment').get.mockResolvedValue({ data: [] });

    const result = await getComments.main({ videoId: 'v001', page: 2, pageSize: 5 });
    expect(result.code).toBe(0);
    expect(db.collection('comment').skip).toHaveBeenCalledWith(10);
  });
});

describe('getComments 单元测试 - 异常处理', () => {
  test('UT-27: 数据库异常时返回 code -1 和错误信息', async () => {
    const db = mockCloud.database();
    db.collection('comment').get.mockRejectedValue(new Error('permission denied'));

    const result = await getComments.main({ videoId: 'v001' });
    expect(result.code).toBe(-1);
    expect(result.message).toBe('permission denied');
  });
});
