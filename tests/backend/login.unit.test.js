/**
 * 单元测试：login 云函数 - 核心业务逻辑
 * wx-server-sdk 由 jest config moduleNameMapper 映射为 mock
 * 只校验新用户注册、老用户更新逻辑
 */

const mockCloud = require('wx-server-sdk');
const loginFn = require('../../cloudfunctions/login/index');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('login 单元测试 - 新用户注册', () => {
  test('UT-28: 用户首次登录时，写入 user 集合并返回 openid', async () => {
    const db = mockCloud.database();
    db.collection('user').get.mockResolvedValue({ data: [] });
    db.collection('user').add.mockResolvedValue({ _id: 'new_user_id' });

    const result = await loginFn.main({}, {});
    expect(result.openid).toBe('test_openid_123');
    expect(db.collection('user').add).toHaveBeenCalled();
  });
});

describe('login 单元测试 - 老用户更新', () => {
  test('UT-29: 用户已存在时，更新 lastLoginTime 并返回用户信息', async () => {
    const db = mockCloud.database();
    const existingUser = { _id: 'existing_id', openid: 'test_openid_123', nickName: '玩家A' };
    db.collection('user').get.mockResolvedValue({ data: [existingUser] });
    db.collection('user').doc().update.mockResolvedValue({ stats: { updated: 1 } });

    const result = await loginFn.main({}, {});
    expect(result.openid).toBe('test_openid_123');
    expect(result.userInfo).toEqual(existingUser);
    expect(db.collection('user').doc().update).toHaveBeenCalled();
    expect(db.collection('user').add).not.toHaveBeenCalled();
  });
});

describe('login 单元测试 - 异常处理', () => {
  test('UT-30: 数据库查询异常时，仍返回 openid，userInfo 为 null', async () => {
    const db = mockCloud.database();
    db.collection('user').get.mockRejectedValue(new Error('db error'));

    const result = await loginFn.main({}, {});
    expect(result.openid).toBe('test_openid_123');
    expect(result.userInfo).toBeNull();
  });
});
