# Claude Context — FlowerChan Website

## 知識庫

完整的 vault 操作規則與專案歷史：
@/Users/chinghsiangchan/Documents/Obsidian Vault/Shawn KnowledgeBase/CLAUDE.md

## 本專案概述

小花店（Flower Chan）官方網站，已正式上線。

- 網站：https://flowerchan.com
- 後台：https://flowerchan.com/admin-selina/
- 部署：GitHub → Netlify 自動部署

## 技術架構

```
flowerchan-website/
├── index.html          → 前端主檔（花品資料由 products.json 動態產生）
├── products.json       → 花品資料（FC-001 ~ FC-010，10 筆）
├── netlify.toml        → Netlify 設定
└── admin-selina/       → Selina 後台（Decap CMS）
```

| 服務 | 說明 |
|------|------|
| Netlify | 部署平台，flowerchan.netlify.app |
| Netlify Identity | Selina 後台登入認證 |
| Cloudinary | 花品照片托管，cloud name: dcwgv05q1 |
| No-IP DNS | A @ 75.2.60.5、CNAME www → flowerchan.netlify.app |
| Google 表單 | 訂購流程 → Google 試算表 → LINE 通知 |

## 品牌設計規範

- 主色：`#2D4A3E`（深綠）、金色：`#E8B84B`、奶油底：`#F7F4EE`、粉色：`#F5C5B8`
- 字型：Cormorant Garamond、Great Vibes、Noto Serif TC

## vault 對應路徑

- 專案筆記 → `01_Projects/FlowerChan_Website/`
- 重要決策 → `01_Projects/FlowerChan_Website/decisions.md`
- 完整背景 → `01_Projects/FlowerChan_Website/claude_context.md`

## 改樣式後務必做的事

`assets/site.css` 或 `assets/site.js` 改過之後，要把所有 HTML 裡的版本號一起換掉，
否則瀏覽器會繼續用舊的快取檔，改了等於沒改（客人看到的也是舊版）。

```bash
V=$(date +%Y%m%d)
python3 - "$V" <<'EOF'
import io, glob, re, sys
v = sys.argv[1]
for p in glob.glob('*.html'):
    s = io.open(p, encoding='utf-8').read()
    s = re.sub(r'(href="/assets/site\.css)(\?v=\d+)?(")', r'\1?v=' + v + r'\3', s)
    s = re.sub(r'(src="/assets/site\.js)(\?v=\d+)?(")',  r'\1?v=' + v + r'\3', s)
    io.open(p, 'w', encoding='utf-8').write(s)
EOF
```

## 常見排錯

**SSL 錯誤（NET::ERR_CERT_COMMON_NAME_INVALID）**
1. 確認 No-IP 有 www CNAME → flowerchan.netlify.app
2. Netlify → Domain management → SSL → Retry DNS verification
3. 等 10 分鐘

**後台無法登入**
- 登入畫面有「忘記密碼？寄登入連結給我」，Selina 可自助重設
- 確認 Netlify → Project「flowerchan」→ Identity 名單內有該 Email
- `index.html` 末尾的 token 轉送 script 不可刪除：Netlify 的帳號信一律導向首頁，
  少了它，邀請信與重設密碼信點下去都不會有反應

**改了樣式但看起來沒變**
- 先確認線上 `assets/site.css` 是否已含新樣式（部署通常 10 秒內完成）
- 是的話就是瀏覽器快取，按 Cmd + Shift + R 強制重整
- 根本解法見上方「改樣式後務必做的事」
