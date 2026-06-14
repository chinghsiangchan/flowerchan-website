/* ═══════════════════════════════════════════
   Flower Chan 小花店 — 共用腳本（redesign）
   ═══════════════════════════════════════════ */

/* ── Google Analytics (GA4)：全站共用，一處注入 ── */
(function () {
  var GA_ID = 'G-BVS50B3YHN';
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID);
})();

const CLOUDINARY_CLOUD = 'dcwgv05q1';
const LINE_URL = 'https://lin.ee/jZUeNhm';

/* 類別定義（網站四類，2026-06-12 定案） */
const CATEGORIES = [
  { slug: 'bouquet',      zh: '花束',   en: 'BOUQUET' },
  { slug: 'table-flower', zh: '桌花',   en: 'TABLE FLOWERS' },
  { slug: 'flower-stand', zh: '高架花', en: 'FLOWER STANDS' },
  { slug: 'orchid',       zh: '蘭花',   en: 'ORCHIDS' },
  { slug: 'preserved',    zh: '永生花', en: 'PRESERVED FLOWERS' },
];

/* 場合（C2）：起始 9 項。現階段相容——比對 product.occasions 欄位 + 現有 tags。
   送禮靈感為 catch-all（全部）。日後後台 A3 會把場合獨立成 occasions 欄位。 */
const OCCASIONS = [
  { key: '生日',        tags: ['生日'] },
  { key: '情人節/紀念日', tags: ['情人節', '紀念日'] },
  { key: '婚禮',        tags: ['婚禮'] },
  { key: '畢業',        tags: ['畢業'] },
  { key: '開幕·活動',   tags: ['開幕', '會場', '企業'] },
  { key: '喬遷',        tags: ['喬遷'] },
  { key: '探病',        tags: ['探病'] },
  { key: '弔唁',        tags: ['弔唁'] },
  { key: '送禮靈感',     tags: [] },
];
/* 所有「場合來源標籤」集合，用來把場合 tag 從風格 tag 裡分出來 */
const OCCASION_SOURCE_TAGS = OCCASIONS.reduce((a, o) => a.concat(o.tags, o.key), []);

function productMatchesOccasion(p, occKey) {
  const occ = OCCASIONS.find(o => o.key === occKey);
  if (!occ) return false;
  if (!occ.tags.length) return true;                 // 送禮靈感＝全部
  const pool = (p.occasions || []).concat(p.tags || []);
  return occ.tags.some(t => pool.includes(t)) || pool.includes(occKey);
}
/* 取花品的「風格/花材」標籤（排除場合來源標籤） */
function styleTagsOf(p) {
  return (p.tags || []).filter(t => !OCCASION_SOURCE_TAGS.includes(t));
}
/* 首頁 hero 下方場合 chips */
function initOccasionBar() {
  const box = document.getElementById('occasionChips');
  if (!box) return;
  box.innerHTML = OCCASIONS.map(o => {
    const cls = o.key === '送禮靈感' ? 'occasion-chip occasion-chip--accent' : 'occasion-chip';
    return `<a class="${cls}" href="/occasion.html?o=${encodeURIComponent(o.key)}">${o.key}</a>`;
  }).join('');
}

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
  if (p.status === '完售' || p.status === '售完')   return '<span class="status-badge soldout">完　售</span>';
  if (p.status === '預購中' || p.status === '預訂中') return '<span class="status-badge preorder">預購中</span>';
  return '';
}
function isSoldout(p) { return p.status === '完售' || p.status === '售完'; }

/* 花品卡片 HTML（共用：首頁精選、類別頁） */
const CAT_CLASS = { '花束': 'cat-bouquet', '桌花': 'cat-table', '高架花': 'cat-stand', '蘭花': 'cat-orchid', '永生花': 'cat-preserved' };
const CAT_LABEL = { '花束': '花束', '桌花': '桌花', '高架花': '高架花籃', '蘭花': '蘭花', '永生花': '永生花' };

function flowerCardHtml(p) {
  const soldout = isSoldout(p);
  const cat = p.category || '花束';
  const catClass = CAT_CLASS[cat] || 'cat-bouquet';
  const priceNote = cat === '高架花'
    ? ' <small>依實際尺寸略有差異</small>' : '';
  return `
    <div class="flower-card reveal ${catClass}">
      ${statusBadge(p)}
      <span class="cat-ribbon">${CAT_LABEL[cat] || cat}</span>
      <a class="flower-link" href="/product.html?code=${p.code}">
        <img class="flower-photo${soldout ? ' dimmed' : ''}" src="${getPhotoUrl(p)}" alt="${p.name}"
          loading="lazy" decoding="async"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="flower-photo-placeholder" style="display:none">🌸</div>
      </a>
      <div class="flower-body">
        <p class="flower-code">${p.code}</p>
        <a class="flower-link" href="/product.html?code=${p.code}"><p class="flower-name">${p.name}</p></a>
        <div class="flower-tags">${(p.tags || []).map(t => `<span class="flower-tag">${t}</span>`).join('')}</div>
        ${p.description ? `<p class="flower-desc">${p.description}</p>` : ''}
        <div class="flower-price-row">
          <span class="flower-price">NT$ ${Number(p.price).toLocaleString()}${priceNote}</span>
        </div>
        <div class="card-actions">
          <a class="btn-line2" href="/product.html?code=${p.code}">查看詳情</a>
          ${soldout
            ? '<span class="btn-main disabled">已售完</span>'
            : `<a class="btn-main" href="/#order?product=${p.code}" onclick="return goOrder('${p.code}')">立即下單</a>`}
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
        ? `<img class="course-photo" src="${photo}" alt="${c.name}" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
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
        <div class="card-actions">
          <a class="btn-line2" href="${detailUrl}">課程詳情</a>
          ${c.status === '已結束' || c.status === '額滿'
            ? '<span class="btn-line2 disabled">本期已截止</span>'
            : `<a class="btn-line2 is-line" href="${LINE_URL}" target="_blank">LINE 詢問報名</a>`}
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

/* ── 內頁主圖：電商式就地放大（點擊放大 2x，拖曳看局部，再點還原）
   附 minimap 定位框：放大時右下角浮出縮圖，白框標示目前檢視區塊，可點縮圖移動 ── */
function setupImageZoom(img) {
  if (!img || img.dataset.zoomBound) return;
  img.dataset.zoomBound = '1';          // 避免重複綁定
  const ZOOM = 2;
  const VIEW = 1 / ZOOM;                  // 放大時可視範圍占整張的比例（2x → 一半）
  const frame = img.closest('.zoom-frame') || img.parentElement;

  // 建立 minimap（縮圖 + 定位框），每個 frame 只建一次
  let mini = frame.querySelector('.zoom-mini');
  if (!mini) {
    mini = document.createElement('div');
    mini.className = 'zoom-mini';
    mini.innerHTML = '<img alt=""><span class="zoom-mini-box"></span>';
    frame.appendChild(mini);
  }
  const miniImg = mini.querySelector('img');
  const miniBox = mini.querySelector('.zoom-mini-box');

  let ox = 50, oy = 50;                    // transform-origin（%）
  const isZoomed = () => img.classList.contains('zoomed');

  const apply = () => {
    img.style.transformOrigin = ox + '% ' + oy + '%';
    // 定位框：左/上 = origin*(1-VIEW)，寬/高 = VIEW
    miniBox.style.left   = (ox * (1 - VIEW)) + '%';
    miniBox.style.top    = (oy * (1 - VIEW)) + '%';
    miniBox.style.width  = (VIEW * 100) + '%';
    miniBox.style.height = (VIEW * 100) + '%';
  };

  const setOriginFromImg = (e) => {
    const r = img.getBoundingClientRect();
    const pt = e.touches && e.touches[0] ? e.touches[0] : e;
    ox = Math.max(0, Math.min(100, (pt.clientX - r.left) / r.width * 100));
    oy = Math.max(0, Math.min(100, (pt.clientY - r.top) / r.height * 100));
    apply();
  };

  const zoomIn = () => {
    img.style.transform = 'scale(' + ZOOM + ')';
    img.classList.add('zoomed');
    miniImg.src = img.currentSrc || img.src;
    mini.classList.add('show');
    apply();
  };
  const zoomOut = () => {
    img.style.transform = '';
    img.classList.remove('zoomed');
    mini.classList.remove('show');
  };

  img.addEventListener('click', (e) => { isZoomed() ? zoomOut() : (setOriginFromImg(e), zoomIn()); });
  img.addEventListener('mousemove', (e) => { if (isZoomed()) setOriginFromImg(e); });
  // 離開整個 frame 才還原（移到 minimap 上不會被重置）
  frame.addEventListener('mouseleave', () => { if (isZoomed()) zoomOut(); });
  img.addEventListener('touchmove', (e) => { if (isZoomed()) { setOriginFromImg(e); e.preventDefault(); } }, { passive: false });

  // 點 / 拖 minimap 移動檢視區塊（以點擊點為中心）
  const panFromMini = (e) => {
    const r = mini.getBoundingClientRect();
    const pt = e.touches && e.touches[0] ? e.touches[0] : e;
    const mx = Math.max(0, Math.min(1, (pt.clientX - r.left) / r.width));
    const my = Math.max(0, Math.min(1, (pt.clientY - r.top) / r.height));
    // 讓點擊點成為可視範圍中心：center = origin*(1-VIEW)+VIEW/2 = m
    ox = Math.max(0, Math.min(100, (mx - VIEW / 2) / (1 - VIEW) * 100));
    oy = Math.max(0, Math.min(100, (my - VIEW / 2) / (1 - VIEW) * 100));
    if (!isZoomed()) zoomIn(); else apply();
  };
  mini.addEventListener('click', (e) => { e.stopPropagation(); panFromMini(e); });
  mini.addEventListener('mousemove', (e) => { if (e.buttons & 1) { e.stopPropagation(); panFromMini(e); } });
  mini.addEventListener('touchmove', (e) => { e.stopPropagation(); e.preventDefault(); panFromMini(e); }, { passive: false });
}

/* ── 縮圖翻頁列：內容塞不滿時自動隱藏箭頭 ── */
function setupThumbCarousel() {
  const track = document.getElementById('thumbTrack');
  if (!track) return;
  const row = track.closest('.thumb-row');
  const arrows = row ? row.querySelectorAll('.thumb-arrow') : [];
  const update = () => {
    const overflow = track.scrollWidth > track.clientWidth + 4;   // 真的有東西被藏起來才顯示箭頭
    arrows.forEach(a => { a.style.display = overflow ? '' : 'none'; });
  };
  update();
  window.addEventListener('resize', update);
}

/* 縮圖翻頁：一次移動一整個可視寬度 */
function scrollThumbs(dir) {
  const tr = document.getElementById('thumbTrack');
  if (tr) tr.scrollBy({ left: dir * tr.clientWidth, behavior: 'smooth' });
}

/* ── 手機 sticky 底部 CTA：捲過 hero 後出現雙鈕（LINE｜立即預訂）── */
(function () {
  function initMobileCta() {
    if (document.getElementById('mobileCta')) return;
    const bar = document.createElement('div');
    bar.id = 'mobileCta';
    bar.className = 'mobile-cta';
    bar.innerHTML =
      '<a class="mcta-btn mcta-line" href="' + LINE_URL + '" target="_blank">LINE 詢問</a>' +
      '<a class="mcta-btn mcta-order" href="/#order">立即預訂</a>';
    document.body.appendChild(bar);
    const onScroll = () => { bar.classList.toggle('show', window.scrollY > 360); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  /* ── 手機選單：點任一連結後自動收起 ── */
  function initMenuAutoClose() {
    const menu = document.getElementById('mobileMenu');
    if (!menu || menu.dataset.autoclose) return;
    menu.dataset.autoclose = '1';
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) menu.classList.remove('open'); });
  }
  const run = () => { initMobileCta(); initMenuAutoClose(); initOccasionBar(); };
  if (document.readyState !== 'loading') run();
  else document.addEventListener('DOMContentLoaded', run);
})();
