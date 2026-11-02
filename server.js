const http = require('http');
const fs = require('fs'); // ⭐️ 新增
const path = require('path'); // ⭐️ 新增

// ⚠️ 重要：把 Key 改成从环境变量读取，部署时在平台上配置，千万别再写死在这里！
const API_KEY = process.env.API_KEY || '你的本地测试KEY'; 
const TARGET_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

const server = http.createServer(async (req, res) => {
  // 1. 如果访问根路径，返回 index.html
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading index.html');
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  // 2. 处理 CORS 预检
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // 3. 拦截 POST 请求
  if (req.method === 'POST' && req.url === '/api/chat') {
    let body = '';
    const upstreamController = new AbortController();

    req.on('data', chunk => { body += chunk; });

    res.on('close', () => {
        if (!res.writableEnded) {
            upstreamController.abort(); 
        }
    });
    
    req.on('end', async () => {
      try {
        const response = await fetch(TARGET_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          },
          body: body,
          signal: upstreamController.signal
        });

        if (!response.ok) {
          const errorText = await response.text();
          res.writeHead(response.status, { 'Content-Type': 'application/json' });
          res.end(errorText);
          return; 
        }

        res.writeHead(response.status, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        });

        if (response.body) {
          for await (const chunk of response.body) {
            res.write(chunk);
          }
        }
        res.end();
      } catch (error) {
        if (error.name !== 'AbortError') {
           if (!res.headersSent) {
               res.writeHead(500);
               res.end(JSON.stringify({ error: error.message }));
           }
        }
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = process.env.PORT || 3000; // ⭐️ Render 会自动分配端口
server.listen(PORT, () => {
  console.log(`✅ 代理服务器已启动: http://localhost:${PORT}`);
});