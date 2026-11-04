// Menu button in the top bar: opens a plain list of links, closes on pick, outside tap, or Escape.
(function () {
  var btn = document.querySelector('.nav-menu-btn');
  var list = document.getElementById('nav-menu-list');
  if (!btn || !list) return;

  function setOpen(open) {
    list.hidden = !open;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    setOpen(list.hidden);
    if (!list.hidden) list.querySelector('a').focus();
  });
  list.addEventListener('click', function (e) {
    if (e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('click', function (e) {
    if (!list.hidden && !e.target.closest('.nav-menu')) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !list.hidden) { setOpen(false); btn.focus(); }
  });
})();
