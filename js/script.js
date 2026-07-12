/**
 * script.js
 * ------------------------------------------------------------
 * index.html の data-fill 属性・id にあわせてコンテンツを描画し、
 * ハンバーガーメニュー・スクロール演出・お問い合わせフォーム・
 * 「今月の予定」の3段階フォールバック読み込みを制御します。
 *
 * データの読み込み優先順位（予定のみ）：
 *   ① /api/schedule（admin/schedule.html から更新・GitHub不要）
 *   ② js/content.js に直接書かれたバックアップの予定
 * ------------------------------------------------------------
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeaderScroll();
  initMenu();
  initReveal();
  initBackToTop();

  const site = window.SITE_CONTENT;
  const media = window.SITE_MEDIA;

  renderHero(site, media);
  renderWelcome(site, media);
  renderFirstTime(site);
  renderRegularSchedule(site);
  renderUpcomingSchedule(site);
  renderPastor(site, media);
  renderFacilities(site, media);
  renderChurchSchoolImages(media);
  renderHistory(site, media);
  renderAccess(site);
  renderOffering(site);
  renderFooter(site);
  renderInstagram(site);

  initVerseShare(site);
  initContactTabs();
  initContactForm();
});

/* ============================================================ utils */
function q(sel){ return document.querySelector(sel); }
function qa(sel){ return document.querySelectorAll(sel); }
function escapeHTML(s){
  if (s === undefined || s === null) return '';
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function fmtDate(iso){
  const d = new Date(iso + 'T00:00:00');
  const dows = ['日','月','火','水','木','金','土'];
  return { day: d.getDate(), dow: dows[d.getDay()], month: d.getMonth() + 1, year: d.getFullYear() };
}

/* ============================================================ header */
function initHeaderScroll(){
  const header = q('.header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 20);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

function initMenu(){
  const burger = q('.burger');
  const menu = q('.menu');
  if (!burger || !menu) return;
  const links = qa('.menu-nav a');

  const close = () => {
    burger.classList.remove('is-open');
    menu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };
  const open = () => {
    burger.classList.add('is-open');
    menu.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  burger.addEventListener('click', () => {
    menu.classList.contains('is-open') ? close() : open();
  });
  links.forEach(a => a.addEventListener('click', close));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

/* ============================================================ reveal */
function initReveal(){
  const els = qa('.reveal, .timeline-item');
  if (!('IntersectionObserver' in window)){
    els.forEach(el => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting){
        setTimeout(() => entry.target.classList.add('is-in'), i * 40);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
  els.forEach(el => io.observe(el));
  window.__observeReveal = (el) => io.observe(el);

  // 画面に既に入っているヒーロー部分は即表示
  requestAnimationFrame(() => {
    qa('.hero .reveal').forEach(el => el.classList.add('is-in'));
  });
}

function reobserveNew(container){
  container.querySelectorAll('.reveal:not(.is-in)').forEach(el => window.__observeReveal?.(el));
}

/* ============================================================ back to top */
function initBackToTop(){
  const btn = q('.to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('is-shown', window.scrollY > 600);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ============================================================ hero */
function renderHero(site, media){
  const bg = q('.hero-bg img');
  if (bg && media?.hero){ bg.src = media.hero.image; bg.alt = media.hero.alt || ''; }

  const verseEl = q('[data-fill="hero-verse"]');
  if (verseEl) verseEl.textContent = site.hero.verse;
  const verseRefEl = q('[data-fill="hero-verse-ref"]');
  if (verseRefEl) verseRefEl.textContent = site.hero.verseRef;
  const headlineEl = q('[data-fill="hero-headline"]');
  if (headlineEl) headlineEl.textContent = site.hero.headline;
  const subEl = q('[data-fill="hero-sub"]');
  if (subEl) subEl.textContent = site.hero.sub;
}

/* ============================================================ welcome */
function renderWelcome(site, media){
  const w = site.welcome;
  const titleEl = q('[data-fill="welcome-title"]');
  if (titleEl) titleEl.textContent = w.title;

  const bodyEl = q('[data-fill="welcome-body"]');
  if (bodyEl) bodyEl.innerHTML = w.body.split('\n\n').map(p => `<p>${escapeHTML(p)}</p>`).join('');

  const bulletsEl = q('[data-fill="welcome-bullets"]');
  if (bulletsEl) bulletsEl.innerHTML = w.bullets.map(b => `<li>${escapeHTML(b)}</li>`).join('');

  const imgEl = q('[data-fill="welcome-img"]');
  if (imgEl && media?.welcome){ imgEl.src = media.welcome.image; imgEl.alt = media.welcome.alt || ''; }

  const verseTextEl = q('[data-fill="verse-text"]');
  if (verseTextEl) verseTextEl.textContent = site.verseOfWeek.text;
  const verseRefEl = q('[data-fill="verse-ref"]');
  if (verseRefEl) verseRefEl.textContent = site.verseOfWeek.ref;
}

function initVerseShare(site){
  const btn = q('[data-share-verse]');
  if (!btn) return;
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    const v = site.verseOfWeek;
    const text = `${v.text}（${v.ref}）— 日本基督教団 中京教会`;
    if (navigator.share){
      try { await navigator.share({ title: '今週の御言葉', text, url: location.href }); }
      catch(err){ /* キャンセル時は何もしない */ }
    } else {
      try{
        await navigator.clipboard.writeText(text);
        const original = btn.innerHTML;
        btn.innerHTML = '<span>✓ コピーしました</span>';
        setTimeout(() => { btn.innerHTML = original; }, 1800);
      }catch(err){ console.warn('コピーに失敗しました', err); }
    }
  });
}

/* ============================================================ first-time
   「当日の流れ(flow)」と「よくある質問(faq)」で役割を分け、
   同じ情報を重複させない構成にしています。
---------------------------------------------------------------- */
function renderFirstTime(site){
  const ft = site.firstTime;
  if (!ft) return;

  const flowEl = q('[data-fill="flow"]');
  if (flowEl) flowEl.innerHTML = ft.flow.map((f, i) => `
    <div class="flow-card reveal reveal-delay-${i % 4}">
      <div class="flow-num">${escapeHTML(f.step)}</div>
      <h3>${escapeHTML(f.title)}</h3>
      <p>${escapeHTML(f.body)}</p>
    </div>
  `).join('');

  const faqEl = q('[data-fill="faq"]');
  if (faqEl) faqEl.innerHTML = ft.faq.map((f, i) => `
    <details class="faq-item"${i === 0 ? ' open' : ''}>
      <summary><span><span class="faq-q-mark">Q.</span>${escapeHTML(f.q)}</span></summary>
      <div class="faq-body">${escapeHTML(f.a)}</div>
    </details>
  `).join('');

  if (flowEl) reobserveNew(flowEl);
}

/* ============================================================ schedule */
function renderRegularSchedule(site){
  const el = q('[data-fill="regular-list"]');
  if (!el) return;
  el.innerHTML = site.services.regular.map(r => `
    <li>
      <div class="when">${escapeHTML(r.day)}<br>${escapeHTML(r.time)}</div>
      <div class="what"><strong>${escapeHTML(r.name)}</strong><span>${escapeHTML(r.note)}</span></div>
    </li>
  `).join('');
}

async function renderUpcomingSchedule(site){
  let items = null;

  // ① 管理画面(/api/schedule)経由のデータを優先
  try{
    const res = await fetch('/api/schedule', { cache: 'no-store' });
    if (res.ok){
      const data = await res.json();
      if (data && Array.isArray(data.items) && data.items.length) items = data.items;
    }
  }catch(err){
    console.warn('管理画面データの読み込みに失敗。内蔵データを表示します。', err);
  }

  // ② content.js内蔵のバックアップ
  if (!items) items = (site.services && site.services.schedule) || [];

  paintUpcoming(items);
}

function paintUpcoming(items){
  const monthEl = q('[data-fill="upcoming-month"]');
  const listEl = q('[data-fill="upcoming-list"]');
  if (!listEl) return;

  if (!items.length){
    if (monthEl) monthEl.innerHTML = `<span>予定は準備中です</span>`;
    listEl.innerHTML = '';
    return;
  }

  const first = fmtDate(items[0].date);
  if (monthEl) monthEl.innerHTML = `<span>${first.year}年 ${first.month}月 の予定</span><span class="mono">SCHEDULE</span>`;

  listEl.innerHTML = items.map(s => {
    const d = fmtDate(s.date);
    return `
      <li class="reveal">
        <div class="upcoming-date"><span class="day">${d.day}</span><span class="dow">${d.dow}</span></div>
        <div class="upcoming-body">
          <div class="label">${escapeHTML(s.label)}</div>
          <div class="items">${(s.items || []).map(i => `<span>${escapeHTML(i)}</span>`).join('')}</div>
        </div>
      </li>
    `;
  }).join('');

  reobserveNew(listEl);
}

/* ============================================================ pastor */
function renderPastor(site, media){
  const p = site.pastor;
  const imgEl = q('[data-fill="pastor-img"]');
  if (imgEl && media?.pastor){ imgEl.src = media.pastor.image; imgEl.alt = media.pastor.alt || p.name; }

  const nameEl = q('[data-fill="pastor-name"]');
  if (nameEl) nameEl.textContent = p.name;
  const kanaEl = q('[data-fill="pastor-kana"]');
  if (kanaEl) kanaEl.textContent = `${p.nameKana} ／ ${p.title}`;
  const profileEl = q('[data-fill="pastor-profile"]');
  if (profileEl) profileEl.textContent = p.profile;
  const msgEl = q('[data-fill="pastor-message"]');
  if (msgEl) msgEl.textContent = p.message;
}

/* ============================================================ facilities */
function renderFacilities(site, media){
  const el = q('[data-fill="facilities"]');
  if (!el) return;
  const images = (media && media.facilities) || [];
  el.innerHTML = site.facilities.map((f, i) => {
    const m = images[i] || {};
    const isOrgan = f.name.includes('オルガン');
    return `
      <div class="facility-card reveal reveal-delay-${i % 4}">
        <img src="${m.image || ''}" alt="${escapeHTML(m.alt || f.name)}" loading="lazy"
             onerror="this.style.opacity='0'">
        ${isOrgan ? `
        <button class="organ-play" type="button" aria-label="パイプオルガンの音を聴く" data-play-organ>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>` : ''}
        <div class="facility-overlay">
          <h4>${escapeHTML(f.name)}</h4>
          <p>${escapeHTML(f.body)}</p>
        </div>
      </div>
    `;
  }).join('');
  reobserveNew(el);
  initOrganPlay();
}

function initOrganPlay(){
  if (window.__organPlayBound) return;
  window.__organPlayBound = true;
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-play-organ]');
    if (!btn) return;
    if (!window.__organAudio){
      window.__organAudio = new Audio('assets/audio/organ-sample.mp3');
    }
    const audio = window.__organAudio;
    if (audio.paused){
      audio.play().catch(() => alert('音源ファイル（assets/audio/organ-sample.mp3）がまだ追加されていません。'));
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
      audio.onended = () => { btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'; };
    } else {
      audio.pause(); audio.currentTime = 0;
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    }
  });
}

/* ============================================================ church school */
function renderChurchSchoolImages(media){
  const el = q('[data-fill="cs-images"]');
  if (!el || !media?.churchSchool) return;
  el.innerHTML = media.churchSchool.map(m => `
    <div class="cs-img-box">
      <img src="${m.image}" alt="${escapeHTML(m.alt || '')}" loading="lazy"
           onerror="this.remove(); this.parentElement.classList.add('cs-img-empty');">
    </div>
  `).join('');
}

/* ============================================================ history */
function renderHistory(site, media){
  const el = q('[data-fill="history"]');
  if (!el) return;
  el.innerHTML = site.history.map(h => {
    const imgs = media?.history?.[h.year] || [];
    const photosHtml = imgs.length ? `
      <div class="timeline-photos timeline-photos-${imgs.length}">
        ${imgs.map(img => `
          <div class="timeline-photo-box">
            <img src="${img.image}" alt="${escapeHTML(img.alt || '')}" loading="lazy"
                 onerror="this.closest('.timeline-photo-box').remove();">
          </div>
        `).join('')}
      </div>` : '';
    return `
      <div class="timeline-item">
        <p class="timeline-year">${escapeHTML(h.year)}</p>
        <p class="timeline-text">${escapeHTML(h.event)}</p>
        ${photosHtml}
      </div>
    `;
  }).join('');
}

/* ============================================================ access */
function renderAccess(site){
  const a = site.access;
  const addrEl = q('[data-fill="access-addr"]');
  if (addrEl) addrEl.textContent = a.address;

  const routesEl = q('[data-fill="access-routes"]');
  if (routesEl) routesEl.innerHTML = a.routes.map(r => `
    <li>
      <div class="icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
          <circle cx="12" cy="10" r="3.4"/><path d="M12 21s-7-7.6-7-11a7 7 0 1 1 14 0c0 3.4-7 11-7 11z"/>
        </svg>
      </div>
      <div><span class="line">${escapeHTML(r.line)}</span><span class="stn">${escapeHTML(r.station)}</span></div>
      <span class="walk">${escapeHTML(r.walk)}</span>
    </li>
  `).join('');

  const mapEl = q('[data-fill="access-map"]');
  if (mapEl){
    if (a.mapEmbed){
      mapEl.src = a.mapEmbed;
    } else {
      // 埋め込みURL未設定の間は、Googleマップを開くリンクに差し替える
      const wrap = mapEl.closest('.access-map');
      if (wrap){
        wrap.innerHTML = `<a class="map-fallback" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.address)}" target="_blank" rel="noopener">Googleマップで開く →</a>`;
      }
    }
  }
}

/* ============================================================ offering */
function renderOffering(site){
  const introEl = q('[data-fill="offering-intro"]');
  if (introEl) introEl.textContent = site.offering.intro;
  const listEl = q('[data-fill="offering-accounts"]');
  if (listEl) {
    if (site.offering.accounts && site.offering.accounts.length) {
      listEl.innerHTML = site.offering.accounts.map(a => `
        <li><div class="bank">${escapeHTML(a.bank)}</div><div class="detail">${escapeHTML(a.detail)}</div></li>
      `).join('');
    } else {
      listEl.innerHTML = `<li class="offering-pending"><div class="detail">振込先については現在確認中です。準備が整い次第、こちらに掲載いたします。</div></li>`;
    }
  }
}

/* ============================================================ footer */
function renderFooter(site){
  const verseEl = q('[data-fill="footer-verse"]');
  if (verseEl) verseEl.innerHTML = `${escapeHTML(site.hero.verse)}<span class="ref">${escapeHTML(site.hero.verseRef)}</span>`;
  const copyEl = q('[data-fill="footer-copy"]');
  if (copyEl) copyEl.textContent = `© ${new Date().getFullYear()} 日本基督教団 中京教会 / CHUKYO CHURCH`;
}

/* ============================================================ instagram */
async function renderInstagram(site){
  const grid = q('[data-fill="instagram"]');
  if (!grid) return;
  const cfg = window.INSTAGRAM_CONFIG || { enabled: false };

  if (cfg.enabled && cfg.accessToken && cfg.userId){
    try{
      const fields = 'id,caption,media_type,media_url,permalink,thumbnail_url';
      const url = `https://graph.instagram.com/${cfg.userId}/media?fields=${fields}&access_token=${cfg.accessToken}&limit=${cfg.postCount || 6}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Instagram API error');
      const data = await res.json();
      grid.innerHTML = data.data.map(post => `
        <a href="${post.permalink}" target="_blank" rel="noopener">
          <img src="${post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url}" alt="Instagram投稿" loading="lazy">
        </a>
      `).join('');
      return;
    }catch(err){
      console.warn('Instagram連携に失敗したため、ローカル画像を表示します。', err);
    }
  }

  const count = cfg.fallbackCount || 6;
  const folder = cfg.fallbackFolder || 'assets/images/instagram/';
  const profileUrl = cfg.profileUrl || (site.social && site.social.instagram) || '#';
  let html = '';
  for (let i = 1; i <= count; i++){
    const num = String(i).padStart(2, '0');
    html += `
      <a href="${profileUrl}" target="_blank" rel="noopener" class="ig-placeholder">
        <img src="${folder}ig-${num}.jpg" alt="教会の様子" loading="lazy" onerror="this.style.display='none'">
      </a>`;
  }
  grid.innerHTML = html;
}

/* ============================================================ contact */
function initContactTabs(){
  const tabs = qa('.contact-tab');
  if (!tabs.length) return;
  const form = q('[data-contact-form]');
  const hidden = form ? form.querySelector('input[name="kind"]') : null;
  const textarea = form ? form.querySelector('textarea[name="message"]') : null;
  const placeholders = {
    'お問い合わせ': 'ご質問・ご要望などご自由にお書きください',
    '牧師への匿名質問': 'キリスト教や聖書について、気になっていることをお聞かせください。匿名でお送りいただけます。',
    '祈りのリクエスト': 'あなたのために、または大切な方のために、お祈りする課題をお書きください。'
  };
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      const kind = tab.dataset.kind;
      if (hidden) hidden.value = kind;
      if (textarea) textarea.placeholder = placeholders[kind] || '';
    });
  });
}

function initContactForm(){
  const form = q('[data-contact-form]');
  if (!form) return;

  // ページ内に status 表示用の要素がなければ作る
  let status = form.querySelector('.form-status');
  if (!status){
    status = document.createElement('p');
    status.className = 'form-status';
    form.appendChild(status);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.classList.remove('error');
    status.textContent = '送信中です…';

    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());

    try{
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('送信に失敗しました');
      status.textContent = '✓ メッセージを受け付けました。ありがとうございます。';
      form.reset();
    }catch(err){
      console.warn('フォーム送信に失敗。mailtoにフォールバックします。', err);
      const kind = payload.kind || 'お問い合わせ';
      const nameLine = payload.name ? `${payload.name} 様より` : '（匿名）';
      const subject = encodeURIComponent(`【${kind}】中京教会サイトより`);
      const body = encodeURIComponent(`${nameLine}\n\n${payload.message}\n\n返信先: ${payload.email || '（未入力）'}`);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
      status.textContent = 'オンライン送信ができなかったため、メールソフトを開きます。';
      status.classList.add('error');
    }
  });
}
