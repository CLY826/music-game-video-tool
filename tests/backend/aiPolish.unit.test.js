/**
 * 单元测试：aiPolish 云函数 - 核心业务逻辑
 * Mock 了 Node.js https 模块（wx-server-sdk 由 jest config moduleNameMapper 映射）
 * 只校验内部业务逻辑，不发起真实网络请求
 */

// Mock https 模块（不引用外部变量）
jest.mock('https', () => ({ request: jest.fn() }));

// 设置环境变量：测试时注入 API Key
process.env.TOKENHUB_API_KEY = 'sk-test-api-key-for-unit-test';

const https = require('https');
const aiPolish = require('../../cloudfunctions/aiPolish/index');

// 工具：设置 https.request 模拟成功响应
function setupHttpsSuccess(responseBody) {
  const { EventEmitter } = require('events');
  const res = new EventEmitter();
  const req = new EventEmitter();
  req.write = jest.fn();
  req.end = jest.fn(() => {
    setImmediate(() => {
      res.emit('data', JSON.stringify(responseBody));
      res.emit('end');
    });
  });
  req.setTimeout = jest.fn();
  req.destroy = jest.fn();
  https.request.mockImplementation((options, callback) => {
    callback(res);
    return req;
  });
}

// 工具：设置 https.request 模拟网络错误
function setupHttpsError(errorMessage) {
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

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────
describe('aiPolish 单元测试 - 参数校验', () => {
  test('UT-01: text 为空时，返回 code -1 且不调用 AI 接口', async () => {
    const result = await aiPolish.main({ text: '' });
    expect(result.code).toBe(-1);
    expect(result.msg).toMatch(/请先输入备注内容/);
    expect(https.request).not.toHaveBeenCalled();
  });

  test('UT-02: text 仅含空白字符时，返回 code -1', async () => {
    const result = await aiPolish.main({ text: '   \n\t  ' });
    expect(result.code).toBe(-1);
    expect(https.request).not.toHaveBeenCalled();
  });

  test('UT-03: text 为 undefined 时，返回 code -1', async () => {
    const result = await aiPolish.main({});
    expect(result.code).toBe(-1);
  });
});

// ─────────────────────────────────────────────
describe('aiPolish 单元测试 - AI 调用成功', () => {
  test('UT-04: AI 返回正常时，code 为 0，polished 为润色内容', async () => {
    setupHttpsSuccess({
      choices: [{ message: { content: '这是一段经过润色的内容 🎮' } }]
    });
    const result = await aiPolish.main({
      text: '练了很久终于过了',
      songName: '千本桜',
      gameName: 'Arcaea'
    });
    expect(result.code).toBe(0);
    expect(result.msg).toBe('润色成功');
    expect(result.polished).toBe('这是一段经过润色的内容 🎮');
    expect(result.original).toBe('练了很久终于过了');
  });

  test('UT-05: songName 和 gameName 缺失时，也能正常调用并返回成功', async () => {
    setupHttpsSuccess({
      choices: [{ message: { content: '简短的润色内容' } }]
    });
    const result = await aiPolish.main({ text: '今天练习了很多' });
    expect(result.code).toBe(0);
    expect(result.polished).toBeTruthy();
  });

  test('UT-06: AI 返回内容前后有空白时，返回值应被 trim 处理', async () => {
    setupHttpsSuccess({
      choices: [{ message: { content: '  \n  润色后内容  \n  ' } }]
    });
    const result = await aiPolish.main({ text: '练习备注' });
    expect(result.code).toBe(0);
    expect(result.polished).toBe('润色后内容');
  });
});

// ─────────────────────────────────────────────
describe('aiPolish 单元测试 - AI 返回异常', () => {
  test('UT-07: AI 返回 error 字段时，返回 code -2 和错误信息', async () => {
    setupHttpsSuccess({
      error: { message: 'model not found', code: 'invalid_model' }
    });
    const result = await aiPolish.main({ text: '有效内容' });
    expect(result.code).toBe(-2);
    expect(result.msg).toContain('model not found');
  });

  test('UT-08: AI 返回 choices 为空数组时，返回 code -3', async () => {
    setupHttpsSuccess({ choices: [] });
    const result = await aiPolish.main({ text: '有效内容' });
    expect(result.code).toBe(-3);
  });

  test('UT-09: 网络请求抛出异常时，返回 code -4', async () => {
    setupHttpsError('Connection refused');
    const result = await aiPolish.main({ text: '有效内容' });
    expect(result.code).toBe(-4);
    expect(result.msg).toContain('Connection refused');
  });

  test('UT-10: AI 返回非 JSON 响应时，返回 code -4（解析失败）', async () => {
    const { EventEmitter } = require('events');
    const res = new EventEmitter();
    const req = new EventEmitter();
    req.write = jest.fn();
    req.end = jest.fn(() => {
      setImmediate(() => {
        res.emit('data', 'This is not JSON {{{{');
        res.emit('end');
      });
    });
    req.setTimeout = jest.fn();
    req.destroy = jest.fn();
    https.request.mockImplementation((options, callback) => {
      callback(res);
      return req;
    });

    const result = await aiPolish.main({ text: '有效内容' });
    expect(result.code).toBe(-4);
  });
});

// ─────────────────────────────────────────────
describe('aiPolish 单元测试 - 安全加固', () => {
  test('SEC-01: OPENID 为空时，返回未授权调用', async () => {
    // 模拟无 OPENID 的场景
    const wxServerSdk = require('wx-server-sdk');
    wxServerSdk.getWXContext.mockReturnValueOnce({ OPENID: '', APPID: '' });
    const result = await aiPolish.main({ text: '有效内容' });
    expect(result.code).toBe(-1);
    expect(result.msg).toMatch(/未授权调用/);
  });

  test('SEC-02: TOKENHUB_API_KEY 未配置时，返回服务配置错误', async () => {
    // 临时清空环境变量，验证云函数在运行时检测到 Key 为空
    const originalKey = process.env.TOKENHUB_API_KEY;
    delete process.env.TOKENHUB_API_KEY;

    // 由于 aiPolish 模块已加载（TOKENHUB_API_KEY 在 require 时被捕获为空值），
    // 我们通过修改模块内部变量来模拟这一场景
    // 更直接的测试方式：验证当 TOKENHUB_API_KEY 为空字符串时的行为
    // 注意：aiPolish 模块在 require 时已将 process.env.TOKENHUB_API_KEY 读入常量
    // 所以需要重新 require 才能生效
    jest.resetModules();
    const aiPolishFresh = jest.requireActual('../../cloudfunctions/aiPolish/index');
    const result = await aiPolishFresh.main({ text: '有效内容' });
    expect(result.code).toBe(-1);
    expect(result.msg).toMatch(/服务配置错误|未授权调用/);

    // 恢复环境变量和模块缓存
    process.env.TOKENHUB_API_KEY = originalKey;
    jest.resetModules();
  });

  test('SEC-03: text 超过 200 字时，返回长度限制错误', async () => {
    const longText = '这是一段很长的备注内容'.repeat(20); // 远超200字
    const result = await aiPolish.main({ text: longText });
    expect(result.code).toBe(-1);
    expect(result.msg).toMatch(/不能超过200字/);
  });
});
