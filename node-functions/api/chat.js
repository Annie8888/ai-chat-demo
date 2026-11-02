// node-functions/api/chat.js
export default async function onRequest({ request }) {
  // 从环境变量读取 API Key（部署时在控制台配置）
  const API_KEY = process.env.API_KEY;
  const TARGET_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

  // 只处理 POST 请求
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const body = await request.text();

  // 关键：将上游的流式响应直接透传给前端
  const upstreamResponse = await fetch(TARGET_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: body,
  });

  // 直接返回上游的 body（ReadableStream），实现 SSE 透传
  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
