/**
 * wx-server-sdk Mock
 * 隔离云数据库、云存储等腾讯云依赖，仅供后端单元测试使用
 */

// 可在每个测试用例中通过 mockDb 覆写具体行为
const mockDb = {
  collection: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  doc: jest.fn().mockReturnThis(),
  get: jest.fn().mockResolvedValue({ data: [] }),
  add: jest.fn().mockResolvedValue({ _id: 'mock_id_001' }),
  update: jest.fn().mockResolvedValue({ stats: { updated: 1 } }),
  count: jest.fn().mockResolvedValue({ total: 0 }),
  RegExp: jest.fn(({ regexp }) => new RegExp(regexp))
};

mockDb.command = {
  inc: jest.fn(n => ({ $inc: n }))
};

const mockCloud = {
  init: jest.fn(),
  DYNAMIC_CURRENT_ENV: 'test-env',
  database: jest.fn(() => mockDb),
  getWXContext: jest.fn(() => ({
    OPENID: 'test_openid_123',
    APPID: 'test_appid_456'
  }))
};

// 挂载 serverDate 到 db 上
mockDb.serverDate = jest.fn(() => new Date('2026-01-01T00:00:00Z'));

module.exports = mockCloud;
module.exports.__mockDb = mockDb;
