// netlify/functions/orders.js
// 後台訂單看板代理：驗證 Netlify Identity 後，用 server 端密鑰存取 Apps Script。
const ORDERS_URL = process.env.GOOGLE_ORDERS_URL;
const ORDERS_TOKEN = process.env.GOOGLE_ORDERS_TOKEN;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const authHeader = event.headers['authorization'] || event.headers['Authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) return { statusCode: 401, body: JSON.stringify({ error: '請先登入' }) };
  try {
    const v = await fetch(`${process.env.URL}/.netlify/identity/user`, { headers: { Authorization: authHeader } });
    if (!v.ok) return { statusCode: 401, body: JSON.stringify({ error: '登入已過期，請重新登入' }) };
  } catch (e) { return { statusCode: 401, body: JSON.stringify({ error: '身份驗證失敗' }) }; }

  if (!ORDERS_URL || !ORDERS_TOKEN) return { statusCode: 500, body: JSON.stringify({ error: '尚未設定 GOOGLE_ORDERS_URL / GOOGLE_ORDERS_TOKEN' }) };

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) {}

  try {
    let res;
    if (body.action === 'update') {
      res = await fetch(ORDERS_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: ORDERS_TOKEN, row: body.row, status: body.status })
      });
    } else {
      res = await fetch(`${ORDERS_URL}?token=${encodeURIComponent(ORDERS_TOKEN)}`);
    }
    const text = await res.text();
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: text };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
