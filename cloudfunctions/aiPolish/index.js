// cloudfunctions/aiPolish/index.js
// 调用 TokenHub 大模型 API，润色用户上传时的备注说明

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// TokenHub API 配置 — API Key 通过环境变量注入，不再硬编码
const TOKENHUB_API_URL = 'https://tokenhub.tencentmaas.com/v1/chat/completions';
const TOKENHUB_API_KEY = process.env.TOKENHUB_API_KEY || '';

/**
 * 结构化日志工具 — 便于日志采集和分析
 */
function structuredLog(level, message, extra = {}) {
  const entry = {
    time: new Date().toISOString(),
    level: level,
    service: 'aiPolish',
    message: message,
    ...extra,
  };
  if (level === 'ERROR') {
    console.error(JSON.stringify(entry));
  } else if (level === 'WARN') {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

exports.main = async (event, _context) => {
  const startTime = Date.now();
  const { OPENID } = cloud.getWXContext();
  const { text, songName, gameName } = event;

  structuredLog('INFO', 'aiPolish 请求开始', {
    hasText: !!text,
    textLength: text ? text.trim().length : 0,
    hasSongName: !!songName,
    hasGameName: !!gameName,
  });

  // 鉴权校验：拒绝未登录用户调用
  if (!OPENID) {
    structuredLog('WARN', 'aiPolish 未授权调用', { OPENID });
    return { code: -1, msg: '未授权调用' };
  }

  // API Key 检查：确保环境变量已配置
  if (!TOKENHUB_API_KEY) {
    structuredLog('ERROR', 'TOKENHUB_API_KEY 环境变量未配置');
    return { code: -1, msg: '服务配置错误' };
  }

  if (!text || !text.trim()) {
    return { code: -1, msg: '请先输入备注内容' };
  }

  // 输入长度限制：防止滥用
  if (text.trim().length > 200) {
    structuredLog('WARN', '输入内容超长', { length: text.trim().length });
    return { code: -1, msg: '备注内容不能超过200字' };
  }

  // 拼接 prompt
  const systemPrompt = `你是一个音游社区的写作助手。你的任务是帮用户润色练习视频的备注说明。
规则：
1. 保持用户原意不变，只优化表达
2. 语气自然、像真实玩家写的，不要太官方
3. 可以适当加入音游圈常用术语（如 FC、AP、PM、收歌、手元 等）
4. 保留关键信息（难点位置、练习目标等）
5. 字数控制在 50~150 字之间
6. 不要加标题，直接输出润色后的内容
7. 可以适当使用 emoji 增加趣味性，但不要过度`;

  let userPrompt = `请帮我润色这段音游练习备注：${text.trim()}`;
  if (songName) userPrompt += `\n歌曲：${songName}`;
  if (gameName) userPrompt += `\n音游：${gameName}`;

  try {
    const res = await new Promise((resolve, reject) => {
      const https = require('https');

      const body = JSON.stringify({
        model: 'hy3-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 256
      });

      const url = new URL(TOKENHUB_API_URL);
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOKENHUB_API_KEY}`,
          'Content-Length': Buffer.byteLength(body)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error('解析响应失败: ' + data.slice(0, 300)));
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(15000, () => {
        req.destroy();
        reject(new Error('请求超时'));
      });
      req.write(body);
      req.end();
    });

    // 解析 TokenHub 响应（OpenAI 兼容格式）
    if (res.choices && res.choices.length > 0) {
      const polished = res.choices[0].message?.content || '';
      const duration = Date.now() - startTime;
      structuredLog('INFO', 'aiPolish 润色成功', {
        durationMs: duration,
        originalLength: text.trim().length,
        polishedLength: polished.trim().length,
      });
      return {
        code: 0,
        msg: '润色成功',
        original: text.trim(),
        polished: polished.trim()
      };
    }

    // 检查是否有错误信息
    if (res.error) {
      structuredLog('ERROR', 'TokenHub API 错误', { error: res.error });
      return { code: -2, msg: res.error.message || 'AI 服务返回错误' };
    }

    structuredLog('ERROR', 'AI 返回格式异常', { response: JSON.stringify(res).slice(0, 200) });
    return { code: -3, msg: 'AI 返回格式异常: ' + JSON.stringify(res).slice(0, 200) };
  } catch (e) {
    const duration = Date.now() - startTime;
    structuredLog('ERROR', 'AI 润色失败', { error: e.message, durationMs: duration });
    return { code: -4, msg: 'AI 润色失败：' + e.message };
  }
};
