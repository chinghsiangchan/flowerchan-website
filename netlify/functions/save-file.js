// netlify/functions/save-file.js
// 通用存檔：接收後台送來的 JSON，安全地寫入 GitHub 上的白名單檔案。
// 與 save-products.js 共用同樣的登入驗證與分支安全機制；products.json 仍走 save-products。

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = 'chinghsiangchan';
const GITHUB_REPO = 'flowerchan-website';

// 只允許寫入這些檔案，避免被拿來覆寫任意路徑
const ALLOWED = {
  'settings.json': { type: 'object' },
  'courses.json':  { type: 'array' },
  'banners.json':  { type: 'array' },
};

// 分支安全：依「請求網址」判斷要寫哪個分支。
// Netlify function 執行時讀不到 process.env.BRANCH，因此改用 Host 標頭：
// 分支部署網址格式為 <branch>--<site>.netlify.app（例：redesign--flowerchan.netlify.app）。
// 自訂網域或主站（無 -- 前綴）→ main。
function branchFromHost(host) {
  const m = (host || '').match(/^([^.]+)--/);
  return m ? m[1] : 'main';
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const GIT_BRANCH = branchFromHost(event.headers['host'] || event.headers['Host'] || '');

  // 驗證 Netlify Identity token
  const authHeader = event.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) {
    return { statusCode: 401, body: JSON.stringify({ error: '請先登入' }) };
  }
  const userToken = authHeader.replace('Bearer ', '');
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

  // 解析 { file, data }
  let file, data;
  try {
    const payload = JSON.parse(event.body);
    file = payload.file;
    data = payload.data;
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: '資料格式錯誤' }) };
  }

  const rule = ALLOWED[file];
  if (!rule) {
    return { statusCode: 400, body: JSON.stringify({ error: '不允許的檔案：' + file }) };
  }
  if (rule.type === 'array' && !Array.isArray(data)) {
    return { statusCode: 400, body: JSON.stringify({ error: '資料應為陣列' }) };
  }
  if (rule.type === 'object' && (typeof data !== 'object' || data === null || Array.isArray(data))) {
    return { statusCode: 400, body: JSON.stringify({ error: '資料應為物件' }) };
  }

  // 取得目前檔案 SHA
  const getRes = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${file}?ref=${GIT_BRANCH}`,
    { headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' } }
  );
  let sha = '';
  if (getRes.ok) {
    const fileData = await getRes.json();
    sha = fileData.sha;
  }

  // 寫入 GitHub
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
  const putRes = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${file}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Update ${file} via admin (${GIT_BRANCH})`,
        content,
        sha,
        branch: GIT_BRANCH
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
    body: JSON.stringify({ success: true, message: '已更新，網站約 1 分鐘後生效' })
  };
};
