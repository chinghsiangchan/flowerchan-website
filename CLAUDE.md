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

## 常見排錯

**SSL 錯誤（NET::ERR_CERT_COMMON_NAME_INVALID）**
1. 確認 No-IP 有 www CNAME → flowerchan.netlify.app
2. Netlify → Domain management → SSL → Retry DNS verification
3. 等 10 分鐘

**後台無法登入**
- 確認 Netlify Identity 已啟用
- 確認 Selina 的 email 有在 Identity 名單內
