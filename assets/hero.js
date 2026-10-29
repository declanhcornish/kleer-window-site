(function () {
  // Footage: Pexels video 20180774 by Magda, free for commercial use.
  var SRC_LARGE = 'assets/media/hero-720.mp4';
  var SRC_SMALL = 'assets/media/hero-540.mp4';

  var video = document.getElementById('hero-video');
  var toggle = document.getElementById('video-toggle');
  var saveData = navigator.connection && navigator.connection.saveData;

  // The footage is a slow ambient loop, so it plays even with reduced motion on.
  // The pause button covers anyone who wants it still.
  if (video && !saveData) {
    video.src = window.innerWidth > 900 ? SRC_LARGE : SRC_SMALL;
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
    if (toggle) {
      toggle.hidden = false;
      toggle.addEventListener('click', function () {
        if (video.paused) video.play(); else video.pause();
      });
      video.addEventListener('play', function () { toggle.setAttribute('aria-pressed', 'false'); toggle.setAttribute('aria-label', 'Pause background video'); });
      video.addEventListener('pause', function () { toggle.setAttribute('aria-pressed', 'true'); toggle.setAttribute('aria-label', 'Play background video'); });
    }
  }

  // Solid nav once the hero is scrolled past.
  var nav = document.getElementById('nav');
  var hero = document.querySelector('.hero');
  if (nav && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      nav.classList.toggle('solid', !entries[0].isIntersecting);
    }, { rootMargin: '-64px 0px 0px 0px' }).observe(hero);
  }
})();
