// app.js — versão limpa e robusta (com splits, nav/footer e header sticky)

const SUPPORTED = ['pt', 'en', 'es'];
const DEFAULT_LANG = 'pt';

/* ------------------------- Helpers ------------------------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function getLangFromURL() {
  const u = new URL(location.href);
  const q = u.searchParams.get('lang');
  return (q && SUPPORTED.includes(q)) ? q : DEFAULT_LANG;
}
function setLangInURL(lang) {
  const u = new URL(location.href);
  u.searchParams.set('lang', lang);
  history.replaceState({}, '', u.toString());
}
function withLang(href, lang) {
  try {
    const u = new URL(href, location.href);
    u.searchParams.set('lang', lang);
    return u.toString();
  } catch {
    return href;
  }
}
async function loadMessages(lang) {
  const res = await fetch(`./${lang}.json`);
  if (!res.ok) throw new Error(`Tradução ${lang} não encontrada`);
  return res.json();
}
function get(obj, path) {
  return path.split('.')
    .reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), obj);
}
function escapeHTML(s) {
  return String(s).replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
}

/* ---------------------- i18n fill (genérico) ---------------------- */
function fillTexts(messages) {
  // Troca todos os nós com data-i18n
  $$('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = get(messages, key);
    if (typeof val === 'string') el.textContent = val;
  });

  // Pilares (sobre)
  const pillars = get(messages, 'about.pillars') || [];
  const pillarsRoot = $('#pillars');
  if (pillarsRoot) {
    pillarsRoot.innerHTML = pillars.map(p => `
      <article class="card">
        <div class="text-lg" style="font-weight:700">${escapeHTML(p.title)}</div>
        <p class="mt-2" style="color:var(--muted)">${escapeHTML(p.desc)}</p>
      </article>
    `).join('');
  }

  // Etapas (sobre)
  const steps = get(messages, 'about.how.steps') || [];
  const stepsRoot = $('#how-steps');
  if (stepsRoot) {
    stepsRoot.innerHTML = steps.map(s => `<li class="card">${escapeHTML(s)}</li>`).join('');
  }

  // --------- SPLITS da HOME (funciona com ids OU data-i18n) ----------
  const splits = get(messages, 'home.splits');
  if (splits) {
    ['s1','s2','s3'].forEach((k, idx) => {
      const data = splits[k];
      if (!data) return;
      const n = idx + 1;

      // Via ids (mais seguro mesmo sem data-i18n no HTML)
      const t = $(`#split${n}-title`);
      const d = $(`#split${n}-desc`);
      const p = $(`#split${n}-pills`);
      if (t) t.textContent = data.title;
      if (d) d.textContent = data.desc;
      if (p) p.innerHTML = (data.pills || [])
        .map(x => `<div class="pill">${escapeHTML(x)}</div>`).join('');
    });
  }
}

/* --------------------- Header / Nav / Idiomas --------------------- */
function initHeaderNav(lang, messages) {
  // Rotas
  const routes = {
    home: './',
    about: './sobre.html',
    portfolio: './portfolio.html',
    contact: './contato.html'
  };

  // Aplica href com ?lang=
  Object.entries(routes).forEach(([key, file]) => {
    const a = document.querySelector(`a[data-nav="${key}"]`);
    if (a) a.href = withLang(file, lang);
  });

  // Qualquer link .html preserva ?lang=
  document.querySelectorAll('a[href$=".html"], a[href="/"], a[href="./"]').forEach(a => {
    const href = a.getAttribute('href');
    if (href) a.href = withLang(href, lang);
  });
  // Normaliza index.html -> "./"
  document.querySelectorAll('a[href$="index.html"], a[href$="index.html/"]').forEach(a => {
    a.href = withLang('./', lang);
  });

  // Labels do menu: tenta pegar do JSON, senão usa defaults
  const labels = get(messages, 'nav') || {
    pt: {home:'Home', about:'Sobre', portfolio:'Portfólio', contact:'Contato'},
    en: {home:'Home', about:'About', portfolio:'Portfolio', contact:'Contact'},
    es: {home:'Inicio', about:'Sobre', portfolio:'Portafolio', contact:'Contacto'}
  }[lang];

  if (labels) {
    const set = (k, v) => {
      const el = document.querySelector(`a[data-nav="${k}"]`);
      if (el && v) el.textContent = v;
    };
    set('home',      labels.home);
    set('about',     labels.about);
    set('portfolio', labels.portfolio);
    set('contact',   labels.contact);
  }

  // Botões de idioma
  document.querySelectorAll('.lang-btn[data-lang], .btn-ghost[data-lang]').forEach(btn => {
    btn.onclick = () => applyLang(btn.dataset.lang);
  });
}

/* ----------------------- Portfolio (lista) ----------------------- */
const PROJECTS = [
  {
    slug: 'res-alpha',
    tag: 'todos',
    cover: 'https://picsum.photos/seed/a/800/480',
    title: 'Residencial Alpha',
    summary: 'Execução de obra residencial',
    client: 'Cliente A',
    location: 'Uberlândia/MG',
    year: '2024',
    scope: 'Estrutura, alvenaria, acabamentos',
    body: `
      <p>Obra residencial com foco em qualidade de acabamento, segurança e prazo.</p>
      <p>Incluiu gestão completa de equipe, controle tecnológico e comissionamento.</p>
    `
  },
  {
    slug: 'ind-beta',
    tag: 'industrial',
    cover: 'https://picsum.photos/seed/b/800/480',
    title: 'Industrial Beta',
    summary: 'Montagem industrial',
    client: 'Cliente B',
    location: 'Araguari/MG',
    year: '2023',
    scope: 'Caldeiraria, tubulações, soldas especiais',
    body: `<p>Montagem industrial com aplicação de SSMA e controle de qualidade em todo o processo.</p>`
  },
  {
    slug: 'infra-gama',
    tag: 'infra',
    cover: 'https://picsum.photos/seed/c/800/480',
    title: 'Infra Gama',
    summary: 'Pavimentação e drenagem',
    client: 'Prefeitura',
    location: 'Ituiutaba/MG',
    year: '2022',
    scope: 'Pavimentação, drenagem, sinalização',
    body: `<p>Obra de infraestrutura urbana com planejamento para reduzir impacto no trânsito e entregas no prazo.</p>`
  }
];

function initPortfolio(messages, lang) {
  const grid = $('#portfolio-grid');
  if (!grid) return;

  const seeMore = get(messages, 'portfolio.seeMore') || 'Ver detalhes →';

  const card = (p) => {
    const href = withLang(`./project.html?slug=${encodeURIComponent(p.slug)}`, lang);
    return `
      <article class="card">
        <div class="img-tile" style="height:180px"><div class="img" style="background-image:url('${p.cover}')"></div></div>
        <div class="mt-3">
          <div class="text-lg" style="font-weight:700">${escapeHTML(p.title)}</div>
          <p class="mt-1" style="color:var(--muted)">${escapeHTML(p.summary)}</p>
          <a class="link" href="${href}">${seeMore}</a>
        </div>
      </article>
    `;
  };

  const render = (tag = 'todos') => {
    const items = tag === 'todos' ? PROJECTS : PROJECTS.filter(p => p.tag === tag);
    grid.innerHTML = items.map(card).join('');
  };

  const filterBtns = document.querySelectorAll('[data-tag]');
  filterBtns.forEach(btn => {
    btn.onclick = () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render(btn.dataset.tag);
    };
  });

  const first = document.querySelector('[data-tag="todos"]');
  if (first) first.classList.add('active');
  render('todos');
}

/* ----------------------- Project (detalhe) ----------------------- */
function initProjectDetail() {
  const root = $('#project-title');
  if (!root) return;

  const u = new URL(location.href);
  const slug = u.searchParams.get('slug');
  const p = PROJECTS.find(x => x.slug === slug);

  if (!p) {
    root.textContent = 'Projeto não encontrado.';
    return;
  }

  $('#project-title').textContent   = p.title;
  $('#project-summary').textContent = p.summary;
  $('#project-client').textContent  = p.client;
  $('#project-location').textContent= p.location;
  $('#project-year').textContent    = p.year;
  $('#project-scope').textContent   = p.scope;
  $('#project-body').innerHTML      = p.body;

  const hero = $('#project-hero .img');
  if (hero) hero.style.backgroundImage = `url('${p.cover}')`;
}

/* -------------------------- Formulário -------------------------- */
function initForm(messages) {
  const form = $('#contact-form');
  if (!form) return;
  const sending = get(messages, 'form.sending') || 'Enviando...';

  form.addEventListener('submit', () => {
    const btn = form.querySelector('button');
    if (btn) {
      btn.disabled = true;
      btn.textContent = sending;
    }
  });
}

/* ----------------------- Carousel (auto fade) ----------------------- */
function initCarousel(){
  const root = document.querySelector('[data-carousel]');
  if(!root) return;
  const slides = Array.from(root.querySelectorAll('.slide'));
  if(slides.length <= 1) return;

  let i = 0;
  const show = (idx) => {
    slides.forEach((s, k) => s.classList.toggle('active', k === idx));
  };
  show(i);

  setInterval(() => {
    i = (i + 1) % slides.length;
    show(i);
  }, 4500);
}

/* ------------------------- Header sticky ------------------------- */
function initStickyHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll); onScroll();

  const toggle = header.querySelector('.menu-toggle');
  const panel  = header.querySelector('#mobile-panel');
  if (toggle && panel) {
    toggle.addEventListener('click', () => {
      const open = header.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    header.querySelectorAll('#mobile-panel a').forEach(a => {
      a.addEventListener('click', () => {
        header.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
}

function normalizeHomeURL(lang) {
  if (location.pathname.endsWith('/index.html')) {
    history.replaceState({}, '', withLang('./', lang));
  }
}

/* ---------------------------- Boot ---------------------------- */
async function applyLang(lang) {
  if (!SUPPORTED.includes(lang)) lang = DEFAULT_LANG;
  setLangInURL(lang);
  document.documentElement.lang = lang;
  normalizeHomeURL(lang);

  const messages = await loadMessages(lang);
  fillTexts(messages);
  initHeaderNav(lang, messages);
  initPortfolio(messages, lang);
  initProjectDetail();
  initForm(messages);
  initCarousel();

  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();
}

(async function boot() {
  try {
    const lang = getLangFromURL();
    await applyLang(lang);
    initStickyHeader();
  } catch (err) {
    console.error(err);
    if (String(err).includes('Tradução')) {
      alert('Falha ao carregar o site. Verifique os arquivos de tradução.');
    }
  }
})();
