// ─── CATÁLOGO ───
// Este archivo NO tiene productos "hardcodeados": los trae desde data/productos.json
// Para agregar, editar o quitar notebooks, no toques este archivo.
// Usá el panel admin.html, o editá directamente data/productos.json en GitHub.

let SITE_CONFIG = { waNumber: "", instagram: "" };
let PRODUCTS = [];
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

function waLink(text) {
  return `https://wa.me/${SITE_CONFIG.waNumber}?text=${encodeURIComponent(text)}`;
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

function renderCard(p) {
  const img = p.imagenURL
    ? `<img src="${p.imagenURL}" alt="Foto de ${p.marca} ${p.modelo}" loading="lazy" />`
    : placeholderSVG(p.color || '#f07020');
  const badges = (p.badges || []).map(badgeHTML).join('');
  return `
  <article class="product-card" data-badges="${(p.badges || []).join(',')}" data-search="${p.modelo} ${p.marca} ${p.procesador} ${p.ram} ${p.almacenamiento}">
    <div class="card-image">
      ${img}
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
          <div class="price"><span class="price-currency"></span>${formatPrice(p.precio)}</div>
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
    const badges = card.dataset.badges;
    const search = card.dataset.search.toLowerCase();
    const matchFilter = activeFilter === 'all' || badges.includes(activeFilter);
    const matchSearch = searchQuery === '' || search.includes(searchQuery);
    if (matchFilter && matchSearch) {
      card.style.display = '';
      visible++;
    } else {
      card.style.display = 'none';
    }
  });
  const noRes = grid.querySelector('.no-results');
  if (noRes) noRes.remove();
  if (visible === 0) {
    grid.insertAdjacentHTML('beforeend', '<div class="no-results"><p>No encontramos notebooks con esos filtros.<br>Probá otra búsqueda o consultanos directamente.</p></div>');
  }
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
}

async function initCatalog() {
  const grid = document.getElementById('catalogGrid');
  try {
    const res = await fetch('data/productos.json', { cache: 'no-store' });
    const data = await res.json();
    SITE_CONFIG = data.config || SITE_CONFIG;
    PRODUCTS = data.productos || [];
  } catch (err) {
    console.error('No se pudo cargar data/productos.json', err);
    grid.innerHTML = '<div class="no-results"><p>No pudimos cargar el catálogo. Probá recargar la página.</p></div>';
    return;
  }

  applyWaLinksGlobal();

  grid.innerHTML = PRODUCTS.map(renderCard).join('');

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

  window.__AFD_WA_LINK__ = waLink; // usado por el formulario de contacto en theme.js
}

initCatalog();
