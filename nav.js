(function () {
  var overlay = document.getElementById('nav-overlay');
  var drawer = document.getElementById('nav-drawer');
  var btn = document.getElementById('hamburger-btn');
  var closeBtn = document.getElementById('nav-close-btn');

  if (!overlay || !drawer || !btn || !closeBtn) return;

  function openMenu() {
    overlay.classList.add('open');
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
    btn.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    overlay.classList.remove('open');
    drawer.classList.remove('open');
    document.body.style.overflow = '';
    btn.setAttribute('aria-expanded', 'false');
  }

  btn.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', closeMenu);
  overlay.addEventListener('click', closeMenu);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });
})();
