# 安全审查报告

> 项目：音游视频练习辅助小程序（rhythm-practice）
> 审查日期：2026-06-18
> 审查方法：AI 辅助安全审查（OWASP Top 10 视角）
> 审查工具：WorkBuddy AI + Vibe Coding 工作流

---

## 一、审查范围

对项目 5 个核心云函数进行安全审查：

| 云函数 | 文件路径 | 功能 |
|--------|---------|------|
| login | `cloudfunctions/login/index.js` | 用户登录与初始化 |
| getVideos | `cloudfunctions/getVideos/index.js` | 视频分页查询 |
| addComment | `cloudfunctions/addComment/index.js` | 发布评论 |
| getComments | `cloudfunctions/getComments/index.js` | 评论列表查询 |
| aiPolish | `cloudfunctions/aiPolish/index.js` | AI 润色备注 |

---

## 二、发现的安全问题

### 问题 1：硬编码 API Key（高危）

**OWASP 分类：** A07:2021 — Identification and Authentication Failures / 敏感信息暴露

**发现位置：** `cloudfunctions/aiPolish/index.js` 第 9 行

**原始代码：**
```javascript
const TOKENHUB_API_KEY = 'sk-lJpE***REDACTED***';
```

**危害分析：**
- 项目仓库为 GitHub 公开仓库，API Key 直接暴露在源码中
- 任何人可复制该 Key 调用 TokenHub API，产生费用或滥用服务
- 属于最典型的密钥泄露场景，Gitleaks 等工具可直接检出

**修复方式：**
- 将 API Key 改为通过环境变量 `process.env.TOKENHUB_API_KEY` 读取
- 创建 `.env.example` 作为配置示例（不含真实 Key）
- 在微信云开发控制台中为 `aiPolish` 云函数配置环境变量
- `.gitignore` 中添加 `.env` 防止意外提交

**修复后代码：**
```javascript
const TOKENHUB_API_KEY = process.env.TOKENHUB_API_KEY || '';

exports.main = async (event, context) => {
  // API Key 检查：确保环境变量已配置
  if (!TOKENHUB_API_KEY) {
    console.error('TOKENHUB_API_KEY 环境变量未配置');
    return { code: -1, msg: '服务配置错误' };
  }
  // ...
};
```

**危害等级：** 🔴 高危

---

### 问题 2：云函数缺少鉴权校验（中危）

**OWASP 分类：** A01:2021 — Broken Access Control / 失效的访问控制

**发现位置：** 所有 5 个云函数均未校验调用者身份

**危害分析：**
- 云函数默认允许匿名调用，任何小程序用户可直接调用
- `addComment` 可被未登录用户调用，发布匿名垃圾评论
- `aiPolish` 可被未登录用户调用，消耗 AI API 费用
- `getVideos` 和 `getComments` 虽为查询接口风险较低，但缺少鉴权仍不符合安全最佳实践

**修复方式：**
- 在需要鉴权的云函数入口添加 `OPENID` 校验
- 微信云函数可通过 `cloud.getWXContext()` 获取调用者 `OPENID`
- 若 `OPENID` 为空，返回 `{ code: -1, msg: '未授权调用' }`

**修复后代码（aiPolish）：**
```javascript
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();

  if (!OPENID) {
    return { code: -1, msg: '未授权调用' };
  }
  // ...
};
```

**修复后代码（addComment）：**
```javascript
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();

  if (!OPENID) {
    return { code: -1, message: '未授权调用，请先登录' };
  }
  // ...
};
```

**危害等级：** 🟡 中危

---

### 问题 3：分页参数未限制（中危）

**OWASP 分类：** A05:2021 — Security Misconfiguration / 安全配置错误

**发现位置：** `cloudfunctions/getVideos/index.js` 和 `cloudfunctions/getComments/index.js`

**原始代码：**
```javascript
const { page = 0, pageSize = 10 } = event;
// 直接使用 page 和 pageSize，无上限校验
```

**危害分析：**
- 恶意调用者可传入 `pageSize=10000` 拖垮数据库查询
- `page=99999` 可导致 `skip` 计算出极大值，浪费云函数资源配额
- 云函数有单次执行时间和内存限制，超大查询可能导致超时或崩溃

**修复方式：**
- `pageSize` 上限设为 50，`page` 上限设为 100
- `sortBy` 使用白名单校验，只允许 `createTime` 和 `songName`

**修复后代码：**
```javascript
const safePage = Math.max(0, Math.min(Number(page) || 0, 100));
const safePageSize = Math.max(1, Math.min(Number(pageSize) || 10, 50));

const ALLOWED_SORT_FIELDS = ['createTime', 'songName'];
const safeSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createTime';
```

**危害等级：** 🟡 中危

---

### 问题 4：错误信息暴露内部细节（低危）

**OWASP 分类：** A04:2021 — Insecure Design / 不安全设计

**发现位置：** `getVideos`、`addComment`、`getComments`、`login` 的 catch 块

**原始代码：**
```javascript
return { code: -1, message: e.message };
```

**危害分析：**
- `e.message` 可能包含数据库连接字符串、内部 IP、堆栈信息等
- 攻击者可通过故意触发错误收集系统内部信息，辅助后续攻击

**修复方式：**
- 客户端只返回通用错误提示，如"服务暂时不可用"
- 详细错误信息只写入 `console.error` 供云开发日志查看

**修复后代码：**
```javascript
} catch (e) {
  console.error('getVideos error', e);
  return { code: -1, message: '查询服务暂时不可用' };
}
```

**危害等级：** 🟢 低危

---

### 问题 5：关键词搜索未限制长度（低危）

**OWASP 分类：** A05:2021 — Security Misconfiguration

**发现位置：** `cloudfunctions/getVideos/index.js` 的 `keyword` 参数

**原始代码：**
```javascript
if (keyword) {
  query = query.where({
    songName: db.RegExp({ regexp: keyword, options: 'i' })
  });
}
```

**危害分析：**
- 超长正则表达式可能导致数据库查询性能下降
- 极端情况下可构造恶意正则导致 ReDoS（正则拒绝服务）

**修复方式：**
- 限制 keyword 最大长度为 50 字符

**修复后代码：**
```javascript
const safeKeyword = (keyword || '').trim().slice(0, 50);
```

**危害等级：** 🟢 低危

---

### 问题 6：authorName 参数未限制长度（低危）

**OWASP 分类：** A03:2021 — Injection（广义数据注入）

**发现位置：** `cloudfunctions/addComment/index.js`

**原始代码：**
```javascript
const { authorName = '匿名用户' } = event;
// 直接写入数据库，无长度限制
```

**修复方式：**
- 限制 `authorName` 最大长度为 30 字符

```javascript
const safeAuthorName = (authorName || '匿名用户').trim().slice(0, 30);
```

**危害等级：** 🟢 低危

---

## 三、安全检查清单

### 认证与授权

| 检查项 | 适用 | 状态 | 说明 |
|--------|------|------|------|
| 密码存储（bcrypt/argon2） | 不适用 | — | 项目使用微信登录，无密码体系 |
| JWT/Session 过期机制 | 不适用 | — | 使用微信 openid 认证，非 JWT |
| 接口鉴权 | 适用 | ✅ 已修复 | aiPolish 和 addComment 已添加 OPENID 校验 |
| 越权访问 | 适用 | ✅ 安全 | 数据库安全规则基于 `auth.openid == doc.openid` |

### 注入防护

| 检查项 | 适用 | 状态 | 说明 |
|--------|------|------|------|
| SQL 注入 | 不适用 | — | 云数据库为 NoSQL（MongoDB），无 SQL |
| XSS | 适用（低风险） | ✅ 安全 | 小程序 WXML 不执行 HTML/JS；`rich-text` 未使用 |
| NoSQL 注入 | 适用 | ✅ 已加固 | 参数类型校验 + 长度限制 + 白名单过滤 |

### 敏感信息

| 检查项 | 适用 | 状态 | 说明 |
|--------|------|------|------|
| API Key 硬编码 | 适用 | ✅ 已修复 | 改为环境变量读取，.env.example 已创建 |
| .gitignore 包含 .env | 适用 | ✅ 已添加 | .gitignore 中已添加 .env |
| .env.example 示例文件 | 适用 | ✅ 已创建 | 提供 TOKENHUB_API_KEY 配置示例 |

### 依赖安全

| 检查项 | 适用 | 状态 | 说明 |
|--------|------|------|------|
| npm audit | 适用 | ✅ 已运行 | 无高危漏洞（详见下方） |

---

## 四、依赖安全扫描结果

运行 `npm audit` 结果：项目仅依赖 `eslint` 和 `@eslint/js`，均为开发依赖，无已知高危漏洞。

---

## 五、修复总结

| # | 问题 | 危害等级 | 修复状态 |
|---|------|---------|---------|
| 1 | 硬编码 API Key | 🔴 高危 | ✅ 已修复 — 改为环境变量 |
| 2 | 云函数缺少鉴权 | 🟡 中危 | ✅ 已修复 — 添加 OPENID 校验 |
| 3 | 分页参数未限制 | 🟡 中危 | ✅ 已修复 — 添加上限和白名单 |
| 4 | 错误信息暴露内部细节 | 🟢 低危 | ✅ 已修复 — 返回通用错误提示 |
| 5 | keyword 长度未限制 | 🟢 低危 | ✅ 已修复 — 限制最大 50 字符 |
| 6 | authorName 长度未限制 | 🟢 低危 | ✅ 已修复 — 限制最大 30 字符 |

所有 6 个安全问题均已修复并提交代码。

---

## 六、CI 自动化安全扫描

已在 GitHub Actions 中集成 **Gitleaks** 密钥泄露扫描，配置文件为 `.github/workflows/security.yml`。

每次 push 和 pull_request 时自动扫描：
- 检测代码中是否包含硬编码的 API Key、密码、证书等敏感信息
- 防止未来开发中再次引入密钥泄露问题

---

## 七、结论

通过 AI 辅助安全审查（OWASP Top 10 视角），发现 6 个安全问题（1 个高危、2 个中危、3 个低危），全部已修复。主要修复包括：

1. **密钥管理规范化** — API Key 从硬编码改为环境变量注入，防止泄露
2. **访问控制加固** — 关键云函数添加身份校验，防止未授权调用
3. **输入校验增强** — 参数长度限制、类型校验、白名单过滤，防止滥用
4. **错误处理规范化** — 不向客户端暴露内部错误细节

配合 CI 中的 Gitleaks 自动扫描，项目安全性已达到可上线标准。
