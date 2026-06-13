/* ═══════════════════════════════════════════
   Flower Chan 小花店 — 共用腳本（redesign）
   ═══════════════════════════════════════════ */

const CLOUDINARY_CLOUD = 'dcwgv05q1';
const LINE_URL = 'https://lin.ee/jZUeNhm';

/* 類別定義（網站四類，2026-06-12 定案） */
const CATEGORIES = [
  { slug: 'bouquet',      zh: '花束',   en: 'BOUQUET' },
  { slug: 'table-flower', zh: '桌花',   en: 'TABLE FLOWERS' },
  { slug: 'flower-stand', zh: '高架花', en: 'FLOWER STANDS' },
  { slug: 'orchid',       zh: '蘭花',   en: 'ORCHIDS' },
];

/* 圖片 URL（Cloudinary 優先） */
function getPhotoUrl(p, w = 600) {
  if (p.cloudinary_id) {
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload/w_${w},c_fill,q_auto,f_auto/${p.cloudinary_id}`;
  }
  return p.photo || '';
}

/* 載入花品資料 */
async function fetchProducts() {
  const res = await fetch('/products.json?t=' + Date.now());
  const data = await res.json();
  return data.filter(p => p.published !== false);
}

/* 載入課程資料 */
async function fetchCourses() {
  const res = await fetch('/courses.json?t=' + Date.now());
  const data = await res.json();
  return data.filter(c => c.published !== false);
}

/* 狀態標籤：status 欄位（無狀態/現貨/預訂中/售完），舊資料無此欄位則不顯示 */
function statusBadge(p) {
  if (p.status === '售完')   return '<span class="status-badge soldout">售　完</span>';
  if (p.status === '預訂中') return '<span class="status-badge preorder">預訂中</span>';
  if (p.status === '現貨')   return '<span class="status-badge instock">現　貨</span>';
  return '';
}

/* 花品卡片 HTML（共用：首頁精選、類別頁） */
const CAT_CLASS = { '花束': 'cat-bouquet', '桌花': 'cat-table', '高架花': 'cat-stand', '蘭花': 'cat-orchid' };

function flowerCardHtml(p) {
  const soldout = p.status === '售完';
  const catClass = CAT_CLASS[p.category || '花束'] || 'cat-bouquet';
  const priceNote = p.category === '高架花'
    ? ' <small>依實際尺寸略有差異</small>' : '';
  return `
    <div class="flower-card reveal ${catClass}">
      ${statusBadge(p)}
      <a class="flower-link" href="/product.html?code=${p.code}">
        <img class="flower-photo${soldout ? ' dimmed' : ''}" src="${getPhotoUrl(p)}" alt="${p.name}"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="flower-photo-placeholder" style="display:none">🌸</div>
      </a>
      <div class="flower-body">
        <p class="flower-code">${p.code}</p>
        <a class="flower-link" href="/product.html?code=${p.code}"><p class="flower-name">${p.name}</p></a>
        <div class="flower-tags">${(p.tags || []).map(t => `<span class="flower-tag">${t}</span>`).join('')}</div>
        ${p.description ? `<p class="flower-desc">${p.description}</p>` : ''}
        <div class="flower-bottom">
          <span class="flower-price">NT$ ${Number(p.price).toLocaleString()}${priceNote}</span>
          ${soldout
            ? '<span class="flower-btn disabled">已售完</span>'
            : `<a class="flower-btn" href="/#order?product=${p.code}" onclick="return goOrder('${p.code}')">立即下單</a>`}
        </div>
      </div>
    </div>`;
}

/* 從任何頁面前往首頁訂購區並帶入花品 */
function goOrder(code) {
  if (typeof selectProductByCode === 'function' && document.getElementById('orderForm')) {
    selectProductByCode(code);
    return false;
  }
  location.href = '/?order=' + encodeURIComponent(code) + '#order';
  return false;
}

/* 課程卡片 HTML */
function courseCardHtml(c) {
  const statusMap = { '報名中': 'open', '額滿': 'full', '已結束': 'closed' };
  const cls = statusMap[c.status] || 'open';
  const firstId = c.cloudinary_id || (Array.isArray(c.photos) && c.photos[0] && c.photos[0].cloudinary_id) || '';
  const photo = firstId
    ? `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload/w_600,c_fill,q_auto,f_auto/${firstId}`
    : (c.photo || '');
  const detailUrl = `/course.html?code=${c.code}`;
  return `
    <div class="course-card reveal">
      <a class="flower-link" href="${detailUrl}">
      ${photo
        ? `<img class="course-photo" src="${photo}" alt="${c.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="course-photo-placeholder" style="display:none">🌿</div>`
        : '<div class="course-photo-placeholder">🌿</div>'}
      </a>
      <div class="course-body">
        <p class="course-type">${c.type || '常態課程'}${c.date ? ' ｜ ' + c.date : ''}</p>
        <a class="flower-link" href="${detailUrl}"><p class="course-name course-name-zh">${c.name}</p></a>
        ${c.name_en ? `<p class="course-name" style="font-size:0.85rem;font-style:italic;color:var(--muted)">${c.name_en}</p>` : ''}
        <p class="course-meta">
          ${c.duration ? '時長 ' + c.duration : ''}${c.duration && c.capacity ? '　·　' : ''}${c.capacity ? '名額 ' + c.capacity : ''}
        </p>
        ${c.description ? `<p class="course-desc">${c.description}</p>` : ''}
        <div class="course-bottom">
          <span class="course-price">${c.price ? 'NT$ ' + Number(c.price).toLocaleString() : '價格洽詢'}</span>
          <span class="course-status ${cls}">${c.status || '報名中'}</span>
        </div>
        <div style="margin-top:1.1rem;">
          ${c.status === '已結束' || c.status === '額滿'
            ? '<span class="btn-ghost" style="pointer-events:none;opacity:0.5;">本期已截止</span>'
            : `<a class="line-btn" href="${LINE_URL}" target="_blank">LINE 詢問報名</a>`}
        </div>
      </div>
    </div>`;
}

/* 手機選單 */
function toggleMobileMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}

/* Reveal 動畫 */
function observeReveal() {
  const els = document.querySelectorAll('.reveal:not(.visible)');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) setTimeout(() => e.target.classList.add('visible'), i * 80);
    });
  }, { threshold: 0.08 });
  els.forEach(el => obs.observe(el));
}
