(function () {
  var API = window.KLEER_BOOKING_URL;
  var TZ = 'America/Detroit';
  var TOKEN_KEY = 'kw-token';
  var PROFILE_KEY = 'kw-profile';

  var dayFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  var timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });

  var panels = {
    loading: document.getElementById('acct-loading'),
    auth: document.getElementById('acct-auth'),
    sent: document.getElementById('acct-sent'),
    dash: document.getElementById('acct-dash')
  };

  function store(key, value) {
    try { if (value == null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch (e) {}
  }
  function read(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  function show(name) {
    Object.keys(panels).forEach(function (k) { panels[k].hidden = k !== name; });
    window.scrollTo(0, 0);
  }

  function post(body) {
    return fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); });
  }

  function formData(form) {
    var body = {};
    new FormData(form).forEach(function (v, k) { body[k] = String(v).trim(); });
    return body;
  }

  function setError(form, msg) {
    var el = form.querySelector('.error');
    el.textContent = msg || '';
    el.hidden = !msg;
  }

  function busy(form, on, label) {
    var btn = form.querySelector('button[type="submit"]');
    if (on) { btn.dataset.label = btn.textContent; btn.textContent = label; btn.disabled = true; }
    else { btn.textContent = btn.dataset.label || btn.textContent; btn.disabled = false; }
  }

  // Tabs
  [].forEach.call(document.querySelectorAll('.acct-tab'), function (tab) {
    tab.addEventListener('click', function () {
      var which = tab.getAttribute('data-tab');
      [].forEach.call(document.querySelectorAll('.acct-tab'), function (t) {
        var on = t === tab;
        t.classList.toggle('active', on);
        t.setAttribute('aria-selected', on);
      });
      document.getElementById('signup-form').hidden = which !== 'signup';
      document.getElementById('login-form').hidden = which !== 'login';
    });
  });

  function linkSent(email, isNew) {
    document.getElementById('acct-sent-text').textContent = isNew
      ? 'Your account is set up. We sent a sign-in link to ' + email + '. Tap it to open your account.'
      : 'If ' + email + ' has a Kleer Window account, a sign-in link is on its way. Tap it to open your account.';
    show('sent');
  }

  document.getElementById('acct-back').addEventListener('click', function () { show('auth'); });

  document.getElementById('signup-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var form = this;
    var body = formData(form);
    body.type = 'signup';
    var missing = !body.name ? 'Error: enter your name.'
      : body.phone.replace(/\D/g, '').length < 10 ? 'Error: enter a 10 digit phone number.'
      : !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email) ? 'Error: enter a valid email.'
      : body.zip && !/^\d{5}(-\d{4})?$/.test(body.zip) ? 'Error: enter a 5 digit ZIP code.' : '';
    if (missing) { setError(form, missing); return; }
    setError(form, '');
    busy(form, true, 'Creating...');
    post(body).then(function (res) {
      if (!res.ok) throw new Error(res.error);
      linkSent(body.email, true);
    }).catch(function (err) {
      setError(form, err.message && err.message !== 'Failed to fetch' ? err.message : 'Could not create your account. Please try again.');
    }).then(function () { busy(form, false); });
  });

  document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var form = this;
    var body = formData(form);
    body.type = 'login';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)) { setError(form, 'Error: enter a valid email.'); return; }
    setError(form, '');
    busy(form, true, 'Sending...');
    post(body).then(function (res) {
      if (!res.ok) throw new Error(res.error);
      linkSent(body.email, false);
    }).catch(function (err) {
      setError(form, err.message && err.message !== 'Failed to fetch' ? err.message : 'Could not send the link. Please try again.');
    }).then(function () { busy(form, false); });
  });

  function visitRow(v, upcoming) {
    var row = document.createElement('div');
    row.className = 'visit' + (upcoming ? ' upcoming' : '');
    var start = new Date(v.start);
    var when = document.createElement('div');
    when.className = 'visit-when';
    when.textContent = dayFmt.format(start);
    var meta = document.createElement('div');
    meta.className = 'visit-meta';
    meta.textContent = timeFmt.format(start) + (v.package ? ' / ' + v.package : '') + (v.location ? ' / ' + v.location : '');
    row.appendChild(when);
    row.appendChild(meta);
    return row;
  }

  function fillList(el, visits, upcoming, emptyText) {
    el.innerHTML = '';
    if (!visits.length) {
      var p = document.createElement('p');
      p.className = 'visit-empty';
      p.textContent = emptyText;
      el.appendChild(p);
      return;
    }
    visits.forEach(function (v) { el.appendChild(visitRow(v, upcoming)); });
  }

  function renderDash(data) {
    var p = data.profile;
    store(PROFILE_KEY, JSON.stringify(p));
    document.getElementById('dash-hello').textContent = 'Hi ' + (String(p.name).split(' ')[0] || 'there');
    var now = Date.now();
    var upcoming = data.visits.filter(function (v) { return new Date(v.end).getTime() > now; }).reverse();
    var past = data.visits.filter(function (v) { return new Date(v.end).getTime() <= now; });
    fillList(document.getElementById('dash-upcoming'), upcoming, true, 'Nothing scheduled yet.');
    fillList(document.getElementById('dash-past'), past, false, 'Your past visits will show up here.');
    var form = document.getElementById('profile-form');
    ['name', 'phone', 'email', 'address', 'city', 'zip'].forEach(function (k) { form[k].value = p[k] || ''; });
    show('dash');
  }

  function loadAccount(token) {
    show('loading');
    post({ type: 'account', token: token }).then(function (res) {
      if (!res.ok) {
        if (res.expired) store(TOKEN_KEY, null);
        throw new Error(res.error);
      }
      renderDash(res);
    }).catch(function (err) {
      show('auth');
      var form = document.getElementById('login-form');
      document.querySelector('.acct-tab[data-tab="login"]').click();
      setError(form, err.message && err.message !== 'Failed to fetch' ? err.message : 'Could not load your account. Please try again.');
    });
  }

  document.getElementById('profile-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var form = this;
    var body = formData(form);
    body.type = 'update';
    body.token = read(TOKEN_KEY);
    if (body.zip && !/^\d{5}(-\d{4})?$/.test(body.zip)) { setError(form, 'Error: enter a 5 digit ZIP code.'); return; }
    setError(form, '');
    form.querySelector('.saved').hidden = true;
    busy(form, true, 'Saving...');
    post(body).then(function (res) {
      if (!res.ok) throw new Error(res.error);
      store(PROFILE_KEY, JSON.stringify(res.profile));
      form.querySelector('.saved').hidden = false;
    }).catch(function (err) {
      setError(form, err.message && err.message !== 'Failed to fetch' ? err.message : 'Could not save. Please try again.');
    }).then(function () { busy(form, false); });
  });

  document.getElementById('acct-signout').addEventListener('click', function () {
    store(TOKEN_KEY, null);
    store(PROFILE_KEY, null);
    show('auth');
  });

  // A sign-in link lands here as #t=<token>. Keep it, then clean the address bar.
  var m = location.hash.match(/t=([A-Za-z0-9_\-.]+)/);
  if (m) {
    store(TOKEN_KEY, m[1]);
    history.replaceState(null, '', location.pathname);
  }
  var token = read(TOKEN_KEY);
  if (!API) show('auth');
  else if (token) loadAccount(token);
  else show('auth');
})();
