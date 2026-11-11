// Our work: tap a before/after card to see it large.
(function () {
  var track = document.querySelector('.work-track:not(.review-track)');
  if (!track) return;

  var dlg = document.createElement('dialog');
  dlg.className = 'work-view';
  dlg.setAttribute('aria-label', 'Before and after photos');
  dlg.innerHTML =
    '<button type="button" class="work-view-close" aria-label="Close">' +
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg><span>Close</span></button>' +
    '<div class="work-view-pair"></div>' +
    '<p class="work-view-cap"></p>';
  document.body.appendChild(dlg);
  var pair = dlg.querySelector('.work-view-pair');
  var cap = dlg.querySelector('.work-view-cap');

  function open(card) {
    pair.innerHTML = '';
    card.querySelectorAll('.work-pair img').forEach(function (img, i) {
      var big = document.createElement('img');
      big.src = img.currentSrc || img.src;
      big.alt = (i === 0 ? 'Before' : 'After') + ': ' + (card.dataset.title || 'job photo');
      big.width = 720; big.height = 960;
      pair.appendChild(big);
    });
    cap.textContent = card.dataset.title || '';
    dlg.showModal();
    document.documentElement.classList.add('no-scroll');
  }
  function close() { dlg.close(); }

  dlg.addEventListener('close', function () { document.documentElement.classList.remove('no-scroll'); });
  dlg.querySelector('.work-view-close').addEventListener('click', close);
  dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target === pair) close(); });

  track.querySelectorAll('.work-card').forEach(function (card) {
    var name = card.querySelector('.team-name');
    card.dataset.title = name ? name.textContent : '';
    if (card.getAttribute('aria-hidden') === 'true') {
      card.tabIndex = -1;
    } else {
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', 'See ' + card.dataset.title + ' before and after photos bigger');
    }
    card.addEventListener('click', function () { open(card); });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(card); }
    });
  });
})();
