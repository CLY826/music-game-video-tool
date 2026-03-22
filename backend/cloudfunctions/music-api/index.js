const cloudbase = require('@cloudbase/node-sdk');

// 初始化 CloudBase
const app = cloudbase.init({
    env: cloudbase.SYMBOL_CURRENT_ENV
});

const db = app.database();
const _ = db.command;

// 视频集合
const videosCollection = db.collection('videos');

exports.main = async (event, context) => {
    const { path, httpMethod, queryStringParameters, body } = event;
    
    // 设置 CORS 跨域
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };
    
    // 处理预检请求
    if (httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    
    try {
        // ========== 获取视频列表 ==========
        if (path === '/api/videos' && httpMethod === 'GET') {
            const { data } = await videosCollection
                .orderBy('uploadTime', 'desc')
                .get();
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    data: data 
                })
            };
        }
        
        // ========== 创建视频 ==========
        if (path === '/api/videos' && httpMethod === 'POST') {
            const { title, gameName, cloudUrl } = JSON.parse(body);
            
            if (!title || !gameName) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        success: false, 
                        error: '缺少必要参数' 
                    })
                };
            }
            
            // 获取用户身份（从请求头获取）
            const openid = event.headers?.['x-wx-openid'] || 'anonymous';
            
            const result = await videosCollection.add({
                title,
                gameName,
                cloudUrl: cloudUrl || '',
                uploadTime: new Date(),
                createdAt: new Date(),
                _openid: openid
            });
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    data: { 
                        id: result.id, 
                        title, 
                        gameName, 
                        cloudUrl 
                    }
                })
            };
        }
        
        // ========== 获取单个视频 ==========
        if (path?.startsWith('/api/videos/') && httpMethod === 'GET') {
            const id = path.split('/').pop();
            const { data } = await videosCollection.doc(id).get();
            
            if (!data || data.length === 0) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ 
                        success: false, 
                        error: '视频不存在' 
                    })
                };
            }
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    data: data[0] 
                })
            };
        }
        
        // ========== 按游戏名称查询 ==========
        if (path === '/api/videos/search' && httpMethod === 'GET') {
            const gameName = queryStringParameters?.gameName;
            
            if (!gameName) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        success: false, 
                        error: '缺少游戏名称参数' 
                    })
                };
            }
            
            const { data } = await videosCollection
                .where({
                    gameName: _.eq(gameName)
                })
                .orderBy('uploadTime', 'desc')
                .get();
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    data: data 
                })
            };
        }
        
        // ========== 删除视频 ==========
        if (path?.startsWith('/api/videos/') && httpMethod === 'DELETE') {
            const id = path.split('/').pop();
            await videosCollection.doc(id).remove();
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    message: '删除成功' 
                })
            };
        }
        
        // ========== 健康检查 ==========
        if (path === '/health' && httpMethod === 'GET') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    status: 'OK', 
                    message: 'CloudBase 服务运行正常' 
                })
            };
        }
        
        // ========== 404 ==========
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: '接口不存在' 
            })
        };
        
    } catch (error) {
        console.error('错误:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: error.message 
            })
        };
    }
};