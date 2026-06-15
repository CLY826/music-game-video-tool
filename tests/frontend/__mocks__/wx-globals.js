/**
 * 微信小程序前端全局 Mock
 * 模拟 wx 对象、getApp()、Page() 等微信小程序运行时 API
 */

// ─── 单例数据库 Mock（确保每次 database() 返回同一实例） ───
const __dbInstance = {
  collection: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  doc: jest.fn().mockReturnThis(),
  get: jest.fn().mockResolvedValue({ data: [] }),
  add: jest.fn().mockResolvedValue({ _id: 'mock_id' }),
  update: jest.fn().mockResolvedValue({ stats: { updated: 1 } }),
  count: jest.fn().mockResolvedValue({ total: 0 }),
  serverDate: jest.fn(() => new Date()),
  command: {
    inc: jest.fn(n => ({ $inc: n }))
  },
  RegExp: jest.fn(({ regexp }) => new RegExp(regexp))
};

// ─── wx 全局对象 Mock ───
const wx = {
  cloud: {
    database: jest.fn(() => __dbInstance),
    callFunction: jest.fn().mockResolvedValue({
      result: { code: 0, msg: 'ok' }
    }),
    uploadFile: jest.fn().mockResolvedValue({
      fileID: 'cloud://mock-file-id',
      statusCode: 200
    }),
    getTempFileURL: jest.fn().mockResolvedValue({
      fileList: []
    }),
    init: jest.fn()
  },
  showToast: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  navigateTo: jest.fn(),
  navigateBack: jest.fn(),
  chooseMedia: jest.fn(),
  showNavigationBarLoading: jest.fn(),
  hideNavigationBarLoading: jest.fn(),
  stopPullDownRefresh: jest.fn(),
  createSelectorQuery: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    boundingClientRect: jest.fn().mockReturnThis(),
    exec: jest.fn(cb => cb([]))
  }))
};

global.wx = wx;

// ─── getApp() Mock ───
global.getApp = jest.fn(() => ({
  globalData: {
    userInfo: { nickName: '测试用户', avatarUrl: 'https://test.com/avatar.png' },
    openid: 'test_openid_123',
    defaultGames: [
      { name: 'Arcaea', icon: '/images/arcaea.png', color: '#6c63ff' },
      { name: 'Phigros', icon: '/images/phigros.png', color: '#2196f3' },
      { name: 'CHUNITHM', icon: '/images/chunithm.png', color: '#ff5722' }
    ]
  },
  getOpenid: jest.fn(cb => cb('test_openid_123'))
}));

// ─── Page() Mock ───
// 捕获 Page() 传入的对象定义，方便测试中实例化
const __pageDefinitions = {};
global.Page = jest.fn((definition) => {
  // 将定义存储，测试时可以取出
  definition.__pagePath = global.__currentPagePath || 'unknown';
  __pageDefinitions[global.__currentPagePath || 'unknown'] = definition;
  return definition;
});

// ─── Component() Mock ───
global.Component = jest.fn((definition) => definition);

// ─── 导出 ───
module.exports = { wx, __pageDefinitions, __dbInstance };
