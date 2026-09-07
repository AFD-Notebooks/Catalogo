// ─── ADMIN PANEL — lee y escribe directo en el repo de GitHub vía la API ───
// No hay backend: los cambios se guardan haciendo un commit a data/productos.json
// (y opcionalmente subiendo imágenes a la carpeta images/) usando un token
// personal de GitHub que se guarda SOLO en este navegador (localStorage).

const LS_KEY = 'afd_admin_config';

let cfg = null;          // { owner, repo, branch, token, jsonPath, imagesPath }
let siteData = null;     // { config: {...}, productos: [...] }
let currentSha = null;   // sha de data/productos.json, necesario para poder guardar
let editingId = null;    // id del producto en edición (null = nuevo)
let editingImages = [];  // fotos del producto que se está editando (array de URLs)

// ── Helpers ──
function $(sel) { return document.querySelector(sel); }
function $all(sel) { return document.querySelectorAll(sel); }

function utf8ToBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function slugify(s) {
  return (s || 'producto')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40) || 'producto';
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function toast(msg, type = 'ok') {
  const wrap = $('#toastWrap');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), type === 'err' ? 9000 : 5000);
}

function ghHeaders(extra = {}) {
  return Object.assign({
    'Authorization': `Bearer ${cfg.token}`,
    'Accept': 'application/vnd.github+json'
  }, extra);
}

async function ghGetFile(path) {
  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}?ref=${encodeURIComponent(cfg.branch)}`;
  const res = await fetch(url, { headers: ghHeaders() });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`No se pudo leer ${path} (HTTP ${res.status}). ${res.status === 404 ? 'Revisá el nombre del repo/rama/ruta.' : res.status === 401 || res.status === 403 ? 'Revisá que el token sea válido y tenga permiso de Contents.' : body}`);
  }
  const data = await res.json();
  const content = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
  return { content, sha: data.sha };
}

async function ghPutTextFile(path, contentStr, message, sha) {
  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}`;
  const body = {
    message,
    content: utf8ToBase64(contentStr),
    branch: cfg.branch
  };
  if (sha) body.sha = sha;
  const res = await fetch(url, {
    method: 'PUT',
    headers: ghHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(`No se pudo guardar ${path} (HTTP ${res.status}). ${errBody.message || ''}`);
  }
  return res.json();
}

async function ghPutBinaryFile(path, base64Content, message) {
  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}`;
  const body = { message, content: base64Content, branch: cfg.branch };
  const res = await fetch(url, {
    method: 'PUT',
    headers: ghHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(`No se pudo subir la imagen (HTTP ${res.status}). ${errBody.message || ''}`);
  }
  return res.json();
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Conexión ──
function loadConfigFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveConfigToStorage() {
  localStorage.setItem(LS_KEY, JSON.stringify(cfg));
}

async function connect(fromStoredConfig = false) {
  if (!fromStoredConfig) {
    cfg = {
      owner: $('#cfgOwner').value.trim(),
      repo: $('#cfgRepo').value.trim(),
      branch: $('#cfgBranch').value.trim() || 'main',
      token: $('#cfgToken').value.trim(),
      jsonPath: $('#cfgJsonPath').value.trim() || 'data/productos.json',
      imagesPath: $('#cfgImagesPath').value.trim() || 'images'
    };
    if (!cfg.owner || !cfg.repo || !cfg.token) {
      toast('Completá usuario/organización, repositorio y token.', 'err');
      return;
    }
  }
  $('#connectBtn').disabled = true;
  $('#connectBtn').innerHTML = '<span class="loader"></span> Conectando...';
  try {
    const { content, sha } = await ghGetFile(cfg.jsonPath);
    siteData = JSON.parse(content);
    if (!siteData.config) siteData.config = {};
    // Compatibilidad con el formato viejo (un solo número de WhatsApp)
    if (!siteData.config.whatsapp) {
      siteData.config.whatsapp = siteData.config.waNumber
        ? [{ id: 'principal', label: 'Ventas', numero: siteData.config.waNumber }]
        : [];
    }
    if (!siteData.config.garantiaDefault) siteData.config.garantiaDefault = '1 mes';
    if (!siteData.productos) siteData.productos = [];
    siteData.productos.forEach(p => {
      if (!p.categoria) p.categoria = 'notebook';
      if (!p.imagenes) p.imagenes = p.imagenURL ? [p.imagenURL] : [];
    });
    currentSha = sha;
    saveConfigToStorage();
    showConnectedUI();
    renderAll();
    toast('Conectado. Se cargó el stock actual desde GitHub.');
  } catch (err) {
    console.error(err);
    toast(err.message, 'err');
  } finally {
    $('#connectBtn').disabled = false;
    $('#connectBtn').textContent = 'Conectar';
  }
}

function disconnect() {
  localStorage.removeItem(LS_KEY);
  cfg = null;
  siteData = null;
  currentSha = null;
  $('#connectedPanel').style.display = 'none';
  $('#connectForm').style.display = '';
}

function showConnectedUI() {
  $('#connectForm').style.display = 'none';
  $('#connectedPanel').style.display = '';
  $('#repoLabel').textContent = `${cfg.owner}/${cfg.repo} (rama: ${cfg.branch})`;
}

// ── Guardar productos.json ──
async function persist(message) {
  const jsonStr = JSON.stringify(siteData, null, 2);
  const result = await ghPutTextFile(cfg.jsonPath, jsonStr, message, currentSha);
  currentSha = result.content.sha;
}

// ── Render general ──
function renderAll() {
  $('#instagramInput').value = siteData.config.instagram || '';
  $('#garantiaDefaultInput').value = siteData.config.garantiaDefault || '1 mes';
  renderWaNumbersEditor();
  renderProductList();
}

// ── Números de WhatsApp (varios) ──
// Todos los números aparecen como opciones de contacto; no hay uno "predeterminado".
// Las filas están enlazadas en vivo a siteData.config.whatsapp (cada tecleo actualiza
// el dato en memoria), así que agregar o quitar una fila nunca pisa lo que ya escribiste.
function renderWaNumbersEditor() {
  const wrap = $('#waNumbersEditor');
  const list = siteData.config.whatsapp || [];
  if (list.length === 0) {
    wrap.innerHTML = '<div class="empty-state">Todavía no cargaste ningún número.</div>';
    return;
  }
  wrap.innerHTML = list.map((n, i) => `
    <div class="wa-row" data-id="${n.id}">
      <input type="text" class="wa-label" data-idx="${i}" value="${(n.label || '').replace(/"/g, '&quot;')}" placeholder="Ej: Ventas" />
      <input type="text" class="wa-numero" data-idx="${i}" value="${(n.numero || '').replace(/"/g, '&quot;')}" placeholder="5493511234567" />
      <button type="button" class="wa-remove" title="Quitar número" onclick="removeWaNumberRow('${n.id}')">🗑</button>
    </div>
  `).join('');
  wrap.querySelectorAll('.wa-label').forEach(inp => {
    inp.addEventListener('input', () => { list[+inp.dataset.idx].label = inp.value; });
  });
  wrap.querySelectorAll('.wa-numero').forEach(inp => {
    inp.addEventListener('input', () => { list[+inp.dataset.idx].numero = inp.value; });
  });
}

function addWaNumberRow() {
  if (!siteData.config.whatsapp) siteData.config.whatsapp = [];
  siteData.config.whatsapp.push({ id: uid(), label: '', numero: '' });
  renderWaNumbersEditor();
}

function removeWaNumberRow(id) {
  siteData.config.whatsapp = (siteData.config.whatsapp || []).filter(n => n.id !== id);
  renderWaNumbersEditor();
}

async function saveGeneralConfig() {
  const numbers = (siteData.config.whatsapp || [])
    .map(n => ({ id: n.id, label: (n.label || '').trim() || 'WhatsApp', numero: (n.numero || '').replace(/\D/g, '') }))
    .filter(n => n.numero);
  if (numbers.length === 0) {
    toast('Cargá al menos un número de WhatsApp.', 'err');
    return;
  }
  siteData.config.whatsapp = numbers;
  siteData.config.instagram = $('#instagramInput').value.trim().replace(/^@/, '');
  siteData.config.garantiaDefault = $('#garantiaDefaultInput').value.trim() || '1 mes';
  delete siteData.config.waNumber; // formato viejo, ya no se usa
  try {
    await persist('Actualiza números de WhatsApp / Instagram / garantía');
    renderWaNumbersEditor();
    toast('Datos de contacto actualizados.');
  } catch (err) {
    console.error(err);
    toast(err.message, 'err');
  }
}

// ── Lista de productos ──
function renderProductList() {
  const list = $('#productList');
  const productos = siteData.productos || [];
  if (productos.length === 0) {
    list.innerHTML = '<div class="empty-state">Todavía no hay equipos cargados.</div>';
    return;
  }
  list.innerHTML = productos.map(p => {
    const cover = (p.imagenes || [])[0];
    const catLabel = p.categoria === 'tablet' ? '📱' : '💻';
    return `
    <div class="product-row">
      <div class="thumb">${cover ? `<img src="${cover}" alt="">` : `<svg width="24" height="18" viewBox="0 0 80 60" fill="none"><rect x="4" y="4" width="72" height="48" rx="4" fill="${p.color || '#f07020'}" fill-opacity="0.25"/></svg>`}</div>
      <div class="info">
        <div class="name">${catLabel} ${p.marca} ${p.modelo}${(p.badges || []).map(b => `<span class="badge-pill">${b}</span>`).join('')}</div>
        <div class="sub">${p.procesador} · ${p.ram} · ${p.estado} · ${(p.imagenes || []).length} foto(s)</div>
      </div>
      <div class="price">
        ${p.precioAnterior && Number(p.precioAnterior) > Number(p.precio) ? `<div style="text-decoration:line-through;color:var(--text3);font-size:12px;">$${Number(p.precioAnterior).toLocaleString('es-AR')}</div>` : ''}
        $${Number(p.precio || 0).toLocaleString('es-AR')}
      </div>
      <div class="actions">
        <button title="Editar" onclick="openProductModal(${p.id})">✎</button>
        <button title="Eliminar" onclick="deleteProduct(${p.id})">🗑</button>
      </div>
    </div>
  `;
  }).join('');
}

// ── Modal de producto ──
function nextId() {
  const ids = (siteData.productos || []).map(p => p.id);
  return ids.length ? Math.max(...ids) + 1 : 1;
}

function openProductModal(id = null) {
  editingId = id;
  const p = id ? siteData.productos.find(x => x.id === id) : null;
  $('#modalTitle').textContent = p ? 'Editar equipo' : 'Agregar equipo';
  $('#fCategoria').value = p?.categoria || 'notebook';
  $('#fModelo').value = p?.modelo || '';
  $('#fMarca').value = p?.marca || '';
  $('#fProcesador').value = p?.procesador || '';
  $('#fRam').value = p?.ram || '';
  $('#fAlmacenamiento').value = p?.almacenamiento || '';
  $('#fPantalla').value = p?.pantalla || '';
  $('#fEstado').value = p?.estado || 'Muy bueno';
  $('#fPrecio').value = p?.precio || '';
  $('#fPrecioAnterior').value = p?.precioAnterior || '';
  $('#fGarantia').value = p?.garantia || siteData.config.garantiaDefault || '1 mes';
  $('#fColor').value = p?.color || '#f07020';
  $('#fImagenFiles').value = '';
  $('#fImagenURLAdd').value = '';
  ['recomendada', 'oferta', 'gaming'].forEach(b => {
    $(`#fBadge_${b}`).checked = (p?.badges || []).includes(b);
  });
  editingImages = p?.imagenes ? [...p.imagenes] : (p?.imagenURL ? [p.imagenURL] : []);
  renderImagesManager();
  $('#productModal').classList.add('open');
}

function closeProductModal() {
  $('#productModal').classList.remove('open');
  editingId = null;
  editingImages = [];
}

// ── Varias fotos por producto ──
function renderImagesManager() {
  const wrap = $('#imagesManager');
  if (editingImages.length === 0) {
    wrap.innerHTML = '<div class="empty-state" style="padding:1rem 0;">Todavía no hay fotos para este equipo.</div>';
    return;
  }
  wrap.innerHTML = editingImages.map((url, i) => `
    <div class="image-thumb">
      <img src="${url}" alt="">
      ${i === 0 ? '<span class="image-cover-tag">Portada</span>' : ''}
      <button type="button" title="Quitar foto" onclick="removeImageAt(${i})">×</button>
    </div>
  `).join('');
}

function removeImageAt(i) {
  editingImages.splice(i, 1);
  renderImagesManager();
}

function addImageUrl() {
  const input = $('#fImagenURLAdd');
  const url = input.value.trim();
  if (!url) return;
  editingImages.push(url);
  input.value = '';
  renderImagesManager();
}

async function uploadSelectedImageFiles() {
  const files = Array.from($('#fImagenFiles').files || []);
  if (files.length === 0) return;
  const marca = $('#fMarca').value.trim() || 'equipo';
  const modelo = $('#fModelo').value.trim() || '';
  const addBtn = $('#addFilesBtn');
  addBtn.disabled = true;
  const original = addBtn.textContent;
  try {
    for (let i = 0; i < files.length; i++) {
      addBtn.innerHTML = `<span class="loader"></span> Subiendo ${i + 1}/${files.length}...`;
      const file = files[i];
      const base64 = await fileToBase64(file);
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const filename = `${slugify(marca + '-' + modelo)}-${Date.now()}-${i}.${ext}`;
      const path = `${cfg.imagesPath}/${filename}`;
      const result = await ghPutBinaryFile(path, base64, `Sube foto de ${marca} ${modelo}`);
      editingImages.push(result.content.download_url);
      renderImagesManager();
    }
    toast(`${files.length} foto(s) subida(s).`);
  } catch (err) {
    console.error(err);
    toast(err.message, 'err');
  } finally {
    addBtn.disabled = false;
    addBtn.textContent = original;
    $('#fImagenFiles').value = '';
  }
}

async function saveProductFromModal() {
  const modelo = $('#fModelo').value.trim();
  const marca = $('#fMarca').value.trim();
  const precio = parseInt($('#fPrecio').value, 10) || 0;
  const precioAnteriorRaw = $('#fPrecioAnterior').value.trim();
  const precioAnterior = precioAnteriorRaw ? parseInt(precioAnteriorRaw, 10) : null;
  if (!modelo || !marca || !precio) {
    toast('Completá al menos marca, modelo y precio.', 'err');
    return;
  }
  if (precioAnterior && precioAnterior <= precio) {
    toast('El precio anterior tiene que ser mayor al precio actual para mostrarse como descuento.', 'err');
    return;
  }

  const saveBtn = $('#saveProductBtn');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<span class="loader"></span> Guardando...';

  try {
    const badges = ['recomendada', 'oferta', 'gaming'].filter(b => $(`#fBadge_${b}`).checked);

    const product = {
      id: editingId || nextId(),
      categoria: $('#fCategoria').value,
      modelo, marca,
      procesador: $('#fProcesador').value.trim(),
      ram: $('#fRam').value.trim(),
      almacenamiento: $('#fAlmacenamiento').value.trim(),
      pantalla: $('#fPantalla').value.trim(),
      estado: $('#fEstado').value,
      precio,
      precioAnterior,
      garantia: $('#fGarantia').value.trim() || siteData.config.garantiaDefault || '1 mes',
      badges,
      color: $('#fColor').value,
      imagenes: [...editingImages]
    };

    if (editingId) {
      const idx = siteData.productos.findIndex(x => x.id === editingId);
      siteData.productos[idx] = product;
    } else {
      siteData.productos.push(product);
    }

    await persist(`${editingId ? 'Edita' : 'Agrega'} equipo: ${marca} ${modelo}`);
    renderProductList();
    closeProductModal();
    toast('Guardado. El sitio se va a actualizar en unos segundos.');
  } catch (err) {
    console.error(err);
    toast(err.message, 'err');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Guardar';
  }
}

async function deleteProduct(id) {
  const p = siteData.productos.find(x => x.id === id);
  if (!p) return;
  if (!confirm(`¿Eliminar "${p.marca} ${p.modelo}" del catálogo?`)) return;
  siteData.productos = siteData.productos.filter(x => x.id !== id);
  try {
    await persist(`Elimina equipo: ${p.marca} ${p.modelo}`);
    renderProductList();
    toast('Equipo eliminado.');
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function reloadFromGitHub() {
  try {
    const { content, sha } = await ghGetFile(cfg.jsonPath);
    siteData = JSON.parse(content);
    if (!siteData.config.whatsapp) {
      siteData.config.whatsapp = siteData.config.waNumber
        ? [{ id: 'principal', label: 'Ventas', numero: siteData.config.waNumber }]
        : [];
    }
    siteData.productos.forEach(p => {
      if (!p.categoria) p.categoria = 'notebook';
      if (!p.imagenes) p.imagenes = p.imagenURL ? [p.imagenURL] : [];
    });
    currentSha = sha;
    renderAll();
    toast('Recargado desde GitHub.');
  } catch (err) {
    toast(err.message, 'err');
  }
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  const stored = loadConfigFromStorage();
  if (stored) {
    cfg = stored;
    $('#cfgOwner').value = stored.owner || '';
    $('#cfgRepo').value = stored.repo || '';
    $('#cfgBranch').value = stored.branch || 'main';
    $('#cfgToken').value = stored.token || '';
    $('#cfgJsonPath').value = stored.jsonPath || 'data/productos.json';
    $('#cfgImagesPath').value = stored.imagesPath || 'images';
    connect(true);
  }

  $('#addWaNumberBtn').addEventListener('click', addWaNumberRow);
  $('#addFilesBtn').addEventListener('click', uploadSelectedImageFiles);
  $('#addUrlBtn').addEventListener('click', addImageUrl);
});
