/**
 * 单元测试：health 云函数 - 健康检查
 * wx-server-sdk 由 jest config moduleNameMapper 映射为 mock
 */

const mockCloud = require('wx-server-sdk');
const healthFn = require('../../cloudfunctions/health/index');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('health 单元测试 - 健康检查', () => {
  test('UT-31: 数据库连接正常且 API Key 已配置时，返回 healthy 状态', async () => {
    const db = mockCloud.database();
    db.collection('user').limit().get.mockResolvedValue({ data: [] });

    // 模拟环境变量已配置
    const originalKey = process.env.TOKENHUB_API_KEY;
    process.env.TOKENHUB_API_KEY = 'test-key';

    const result = await healthFn.main({}, {});

    expect(result.code).toBe(0);
    expect(result.data.status).toBe('healthy');
    expect(result.data.checks.database).toBe('connected');
    expect(result.data.checks.envVars.TOKENHUB_API_KEY).toBe(true);
    expect(result.data.version).toBe('1.0.0');
    expect(result.data.timestamp).toBeDefined();

    // 恢复环境变量
    if (originalKey === undefined) {
      delete process.env.TOKENHUB_API_KEY;
    } else {
      process.env.TOKENHUB_API_KEY = originalKey;
    }
  });

  test('UT-32: 数据库连接异常时，database 状态为 disconnected', async () => {
    const db = mockCloud.database();
    db.collection('user').limit().get.mockRejectedValue(new Error('connection lost'));

    const result = await healthFn.main({}, {});

    expect(result.code).toBe(0);
    expect(result.data.checks.database).toBe('disconnected');
  });

  test('UT-33: API Key 未配置时，envVars.TOKENHUB_API_KEY 为 false', async () => {
    const db = mockCloud.database();
    db.collection('user').limit().get.mockResolvedValue({ data: [] });

    // 模拟环境变量未配置
    const originalKey = process.env.TOKENHUB_API_KEY;
    delete process.env.TOKENHUB_API_KEY;

    const result = await healthFn.main({}, {});

    expect(result.code).toBe(0);
    expect(result.data.checks.envVars.TOKENHUB_API_KEY).toBe(false);

    // 恢复环境变量
    if (originalKey !== undefined) {
      process.env.TOKENHUB_API_KEY = originalKey;
    }
  });
});
