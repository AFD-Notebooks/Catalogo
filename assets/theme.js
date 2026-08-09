// ─── THEME (oscuro/claro) ───
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  html.setAttribute('data-theme', current === 'light' ? '' : 'light');
  localStorage.setItem('afd-theme', html.getAttribute('data-theme'));
  updateThemeIcon();
}
function updateThemeIcon() {
  const theme = document.documentElement.getAttribute('data-theme');
  const icon = document.getElementById('themeIcon');
  if (!icon) return;
  if (theme === 'light') {
    icon.innerHTML = '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="none" stroke="currentColor" stroke-width="1.8"/>';
  } else {
    icon.innerHTML = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
  }
}
(function initTheme() {
  const saved = localStorage.getItem('afd-theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon();
})();

// ─── MOBILE MENU ───
function openMobileMenu() {
  document.getElementById('mobileMenu').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeMobileMenu() {
  document.getElementById('mobileMenu').classList.remove('open');
  document.body.style.overflow = '';
}

// ─── CONTACT FORM → WA ───
function sendWhatsAppForm() {
  const name = document.getElementById('cName').value.trim();
  const msg = document.getElementById('cMsg').value.trim();
  if (!msg) { alert('Por favor escribí tu consulta.'); return; }
  const text = `Hola! Soy ${name || 'un interesado'}. ${msg}`;
  const link = window.__AFD_WA_LINK__ ? window.__AFD_WA_LINK__(text) : `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(link, '_blank');
}
