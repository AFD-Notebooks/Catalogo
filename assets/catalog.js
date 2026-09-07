// ─── CATÁLOGO ───
// Este archivo NO tiene productos "hardcodeados": los trae desde data/productos.json
// Para agregar, editar o quitar notebooks/tablets, no toques este archivo.
// Usá el panel admin.html, o editá directamente data/productos.json en GitHub.

let SITE_CONFIG = { whatsapp: [], instagram: '' };
let PRODUCTS = [];
let activeCategory = 'notebook';
let activeFilter = 'all';
let searchQuery = '';

function formatPrice(n) {
  return '$' + Number(n).toLocaleString('es-AR');
}

function badgeHTML(b) {
  const map = {
    recomendada: ['badge-rec', '⭐ Recomendada'],
    oferta: ['badge-sale', '🔥 Oferta'],
    gaming: ['badge-new', '🎮 Gaming']
  };
  return map[b] ? `<span class="badge ${map[b][0]}">${map[b][1]}</span>` : '';
}

// ── WhatsApp: soporta varios números. Se usa el marcado "predeterminado"
// (o el primero de la lista) para los botones generales y de cada producto. ──
function defaultWaNumber() {
  const list = SITE_CONFIG.whatsapp || [];
  const def = list.find(n => n.predeterminado) || list[0];
  return def ? def.numero : '';
}

function waLink(text, numero) {
  const n = numero || defaultWaNumber();
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

function waMsgProducto(p) {
  return `Hola! Me interesa la ${p.marca} ${p.modelo} que tienen publicada. ¿Está disponible?`;
}

function placeholderSVG(color) {
  return `<div class="card-image-placeholder">
    <svg width="80" height="60" viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="72" height="48" rx="4" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-opacity="0.3" stroke-width="1.5"/>
      <rect x="14" y="12" width="52" height="32" rx="2" fill="${color}" fill-opacity="0.08"/>
      <rect x="30" y="48" width="20" height="4" rx="1" fill="${color}" fill-opacity="0.2"/>
      <rect x="24" y="52" width="32" height="3" rx="1" fill="${color}" fill-opacity="0.15"/>
    </svg>
  </div>`;
}

// ── Imagen(es) de la tarjeta: una foto simple, o galería con flechas y puntitos si hay más de una ──
function cardImageHTML(p) {
  const imgs = (p.imagenes && p.imagenes.length) ? p.imagenes : (p.imagenURL ? [p.imagenURL] : []);
  if (imgs.length === 0) return placeholderSVG(p.color || '#f07020');
  if (imgs.length === 1) {
    return `<img src="${imgs[0]}" alt="Foto de ${p.marca} ${p.modelo}" loading="lazy" />`;
  }
  const slides = imgs.map((url, i) => `<img src="${url}" alt="Foto ${i + 1} de ${p.marca} ${p.modelo}" loading="lazy" />`).join('');
  const dots = imgs.map((_, i) => `<span class="gallery-dot${i === 0 ? ' active' : ''}" data-idx="${i}"></span>`).join('');
  return `
    <div class="gallery" data-index="0" data-count="${imgs.length}">
      <div class="gallery-track">${slides}</div>
      <button type="button" class="gallery-arrow gallery-prev" aria-label="Foto anterior">‹</button>
      <button type="button" class="gallery-arrow gallery-next" aria-label="Foto siguiente">›</button>
      <div class="gallery-dots">${dots}</div>
    </div>`;
}

// ── Precio: si hay precioAnterior mayor al precio actual, se muestra tachado + el nuevo + % off ──
function priceHTML(p) {
  const anterior = Number(p.precioAnterior) || 0;
  const actual = Number(p.precio) || 0;
  if (anterior > actual) {
    const off = Math.round((1 - actual / anterior) * 100);
    return `
      <div class="price-old">${formatPrice(anterior)}</div>
      <div class="price-row">
        <div class="price">${formatPrice(actual)}</div>
        <span class="price-off">-${off}%</span>
      </div>`;
  }
  return `<div class="price-row"><div class="price">${formatPrice(actual)}</div></div>`;
}

function renderCard(p) {
  const badges = (p.badges || []).map(badgeHTML).join('');
  return `
  <article class="product-card" data-categoria="${p.categoria || 'notebook'}" data-badges="${(p.badges || []).join(',')}" data-search="${p.modelo} ${p.marca} ${p.procesador} ${p.ram} ${p.almacenamiento}">
    <div class="card-image">
      ${cardImageHTML(p)}
      <div class="card-badges">${badges}</div>
    </div>
    <div class="card-body">
      <div class="card-brand">${p.marca}</div>
      <div class="card-model">${p.modelo}</div>
      <div class="card-specs">
        <div class="spec-row"><span class="spec-key">Procesador</span><span class="spec-val">${p.procesador}</span></div>
        <div class="spec-row"><span class="spec-key">RAM</span><span class="spec-val">${p.ram}</span></div>
        <div class="spec-row"><span class="spec-key">Almacenamiento</span><span class="spec-val">${p.almacenamiento}</span></div>
        <div class="spec-row"><span class="spec-key">Pantalla</span><span class="spec-val">${p.pantalla}</span></div>
        <div class="spec-row"><span class="spec-key">Estado</span><span class="spec-val" style="color:var(--accent)">${p.estado}</span></div>
      </div>
      <div class="card-foot">
        <div class="price-block">
          ${priceHTML(p)}
          <div class="warranty">✓ ${p.garantia} de garantía</div>
        </div>
        <a href="${waLink(waMsgProducto(p))}" target="_blank" rel="noopener" class="btn-contact" aria-label="Consultar por WhatsApp sobre ${p.marca} ${p.modelo}">
          <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
          Consultar
        </a>
      </div>
    </div>
  </article>`;
}

function applyFilters() {
  const grid = document.getElementById('catalogGrid');
  const cards = grid.querySelectorAll('.product-card');
  let visible = 0;
  cards.forEach(card => {
    const categoria = card.dataset.categoria;
    const badges = card.dataset.badges;
    const search = card.dataset.search.toLowerCase();
    const matchCategoria = categoria === activeCategory;
    const matchFilter = activeFilter === 'all' || badges.includes(activeFilter);
    const matchSearch = searchQuery === '' || search.includes(searchQuery);
    if (matchCategoria && matchFilter && matchSearch) {
      card.style.display = '';
      visible++;
    } else {
      card.style.display = 'none';
    }
  });
  const noRes = grid.querySelector('.no-results');
  if (noRes) noRes.remove();
  if (visible === 0) {
    const label = activeCategory === 'tablet' ? 'tablets' : 'notebooks';
    grid.insertAdjacentHTML('beforeend', `<div class="no-results"><p>No encontramos ${label} con esos filtros.<br>Probá otra búsqueda o consultanos directamente.</p></div>`);
  }
}

function setActiveCategory(categoria) {
  activeCategory = categoria;
  document.querySelectorAll('.category-tab').forEach(t => t.classList.toggle('active', t.dataset.categoria === categoria));
  applyFilters();
}

// ── Galería: navegación con flechas / puntitos (delegación de eventos, las tarjetas se inyectan con innerHTML) ──
function moveGallery(galleryEl, dir) {
  const count = parseInt(galleryEl.dataset.count, 10) || 1;
  let idx = parseInt(galleryEl.dataset.index, 10) || 0;
  idx = (idx + dir + count) % count;
  setGalleryIndex(galleryEl, idx);
}

function setGalleryIndex(galleryEl, idx) {
  galleryEl.dataset.index = idx;
  const track = galleryEl.querySelector('.gallery-track');
  track.style.transform = `translateX(-${idx * 100}%)`;
  galleryEl.querySelectorAll('.gallery-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
}

function initGalleryDelegation() {
  const grid = document.getElementById('catalogGrid');
  grid.addEventListener('click', e => {
    const gallery = e.target.closest('.gallery');
    if (!gallery) return;
    if (e.target.closest('.gallery-prev')) { e.preventDefault(); moveGallery(gallery, -1); }
    else if (e.target.closest('.gallery-next')) { e.preventDefault(); moveGallery(gallery, 1); }
    else if (e.target.closest('.gallery-dot')) { e.preventDefault(); setGalleryIndex(gallery, parseInt(e.target.dataset.idx, 10)); }
  });
}

// ── Números de WhatsApp: se listan todos como opciones de contacto en la sección Contacto ──
function renderWaChannels() {
  const wrap = document.getElementById('waChannelsList');
  if (!wrap) return;
  const list = SITE_CONFIG.whatsapp || [];
  if (list.length === 0) { wrap.innerHTML = ''; return; }
  wrap.innerHTML = list.map(n => `
    <a href="${waLink('Hola, me interesa una notebook', n.numero)}" target="_blank" rel="noopener" class="channel-link">
      <div class="ch-icon ch-wa">
        <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
      </div>
      <div>
        <div class="ch-label">${n.label || 'WhatsApp'}</div>
        <div class="ch-sub">+${n.numero}</div>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="margin-left:auto; color:var(--text3)"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    </a>
  `).join('');
}

function applyWaLinksGlobal() {
  document.querySelectorAll('[data-wa-generic]').forEach(a => {
    a.setAttribute('href', waLink('Hola, me interesa una notebook'));
  });
  document.querySelectorAll('[data-ig-link]').forEach(a => {
    a.setAttribute('href', `https://www.instagram.com/${SITE_CONFIG.instagram}/`);
  });
  const igHandle = document.getElementById('igHandle');
  if (igHandle) igHandle.textContent = '@' + SITE_CONFIG.instagram;
  const footerYear = document.getElementById('footerYear');
  if (footerYear) footerYear.textContent = new Date().getFullYear();
  renderWaChannels();
}

async function initCatalog() {
  const grid = document.getElementById('catalogGrid');
  try {
    const res = await fetch('data/productos.json', { cache: 'no-store' });
    const data = await res.json();
    const cfg = data.config || {};
    // Compatibilidad: si el JSON todavía tiene el formato viejo (un solo waNumber), lo convertimos.
    if (!cfg.whatsapp && cfg.waNumber) {
      cfg.whatsapp = [{ id: 'principal', label: 'Ventas', numero: cfg.waNumber, predeterminado: true }];
    }
    SITE_CONFIG = { whatsapp: cfg.whatsapp || [], instagram: cfg.instagram || '' };
    PRODUCTS = (data.productos || []).map(p => ({ categoria: 'notebook', ...p }));
  } catch (err) {
    console.error('No se pudo cargar data/productos.json', err);
    grid.innerHTML = '<div class="no-results"><p>No pudimos cargar el catálogo. Probá recargar la página.</p></div>';
    return;
  }

  applyWaLinksGlobal();

  grid.innerHTML = PRODUCTS.map(renderCard).join('');
  initGalleryDelegation();

  document.querySelectorAll('.category-tab').forEach(tab => {
    tab.addEventListener('click', () => setActiveCategory(tab.dataset.categoria));
  });

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      applyFilters();
    });
  });

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      searchQuery = e.target.value.toLowerCase().trim();
      applyFilters();
    });
  }

  applyFilters();

  window.__AFD_WA_LINK__ = waLink; // usado por el formulario de contacto en theme.js
}

initCatalog();
