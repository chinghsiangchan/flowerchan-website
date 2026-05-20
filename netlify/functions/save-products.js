// netlify/functions/save-products.js
// 負責接收後台送來的花品資料，安全地寫入 GitHub

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = 'chinghsiangchan';
const GITHUB_REPO = 'flowerchan-website';
const FILE_PATH = 'products.json';

exports.handler = async (event) => {
  // 只允許 POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // 驗證 Netlify Identity token
  const authHeader = event.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) {
    return { statusCode: 401, body: JSON.stringify({ error: '請先登入' }) };
  }

  const userToken = authHeader.replace('Bearer ', '');

  // 驗證 Netlify Identity 用戶
  try {
    const verifyRes = await fetch(`${process.env.URL}/.netlify/identity/user`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    if (!verifyRes.ok) {
      return { statusCode: 401, body: JSON.stringify({ error: '登入已過期，請重新登入' }) };
    }
  } catch (e) {
    return { statusCode: 401, body: JSON.stringify({ error: '身份驗證失敗' }) };
  }

  // 解析花品資料
  let products;
  try {
    products = JSON.parse(event.body);
    if (!Array.isArray(products)) throw new Error('格式錯誤');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: '資料格式錯誤' }) };
  }

  // 取得目前 GitHub 上的檔案 SHA（更新檔案需要）
  const getRes = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
    { headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' } }
  );

  let sha = '';
  if (getRes.ok) {
    const fileData = await getRes.json();
    sha = fileData.sha;
  }

  // 寫入 GitHub
  const content = Buffer.from(JSON.stringify(products, null, 2)).toString('base64');
  const putRes = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Update products.json via admin',
        content,
        sha
      })
    }
  );

  if (!putRes.ok) {
    const err = await putRes.text();
    return { statusCode: 500, body: JSON.stringify({ error: '儲存失敗', detail: err }) };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, message: '花品資料已更新，網站約 1 分鐘後生效' })
  };
};
