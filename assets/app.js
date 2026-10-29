(function () {
  var API = window.KLEER_BOOKING_URL;
  var TZ = 'America/Detroit';

  var scheduleEl = document.getElementById('schedule');
  var form = document.getElementById('booking');
  var doneEl = document.getElementById('done');
  var errorEl = document.getElementById('form-error');
  var submitBtn = document.getElementById('submit');

  var days = [];
  var activeDate = null;
  var picked = null;

  var dayFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' });
  var numFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, month: 'short', day: 'numeric' });
  var timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
  var longFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'long', month: 'long', day: 'numeric' });

  function state(msg) {
    scheduleEl.innerHTML = '';
    var p = document.createElement('p');
    p.className = 'state';
    p.textContent = msg;
    scheduleEl.appendChild(p);
  }

  function label(slot) {
    var s = new Date(slot.start);
    return longFmt.format(s) + ' at ' + timeFmt.format(s);
  }

  function load() {
    if (!API) {
      state('Online booking is being connected. Check back soon.');
      return;
    }
    state('Loading the schedule...');
    fetch(API)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.ok) throw new Error();
        days = data.days || [];
        if (!days.length) { state('No times are open right now. Check back soon.'); return; }
        var firstOpen = days.find(function (d) { return d.slots.some(function (s) { return s.available; }); });
        if (!activeDate || !days.some(function (d) { return d.date === activeDate; })) {
          activeDate = (firstOpen || days[0]).date;
        }
        render();
      })
      .catch(function () { state('The schedule could not load. Refresh the page to try again.'); });
  }

  function render() {
    scheduleEl.innerHTML = '';

    var strip = document.createElement('div');
    strip.className = 'days';
    strip.setAttribute('role', 'tablist');
    days.forEach(function (d) {
      var open = d.slots.filter(function (s) { return s.available; }).length;
      var noon = new Date(d.slots[0].start);
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'day' + (d.date === activeDate ? ' active' : '') + (open ? '' : ' full');
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', d.date === activeDate);
      b.innerHTML = '<span class="dow"></span><span class="num"></span><span class="count"></span>';
      b.querySelector('.dow').textContent = dayFmt.format(noon);
      b.querySelector('.num').textContent = numFmt.format(noon);
      b.querySelector('.count').textContent = open ? open + ' open' : 'Full';
      b.addEventListener('click', function () { activeDate = d.date; render(); });
      strip.appendChild(b);
    });
    scheduleEl.appendChild(strip);

    var day = days.find(function (d) { return d.date === activeDate; });
    var list = document.createElement('div');
    list.className = 'slots';
    day.slots.forEach(function (s) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'slot' + (s.available ? '' : ' taken') + (picked && picked.start === s.start ? ' picked' : '');
      b.disabled = !s.available;
      var start = new Date(s.start);
      var end = new Date(s.end);
      b.innerHTML = '<span class="t"></span><span class="s"></span>';
      b.querySelector('.t').textContent = timeFmt.format(start) + ' to ' + timeFmt.format(end);
      b.querySelector('.s').textContent = s.available ? 'Open' : 'Booked';
      b.addEventListener('click', function () { pick(s); });
      list.appendChild(b);
    });
    scheduleEl.appendChild(list);

    var active = strip.querySelector('.active');
    // Scroll only the day strip, never the page.
    if (active) strip.scrollLeft = active.offsetLeft - (strip.clientWidth - active.offsetWidth) / 2;
  }

  function pick(slot) {
    picked = slot;
    render();
    document.getElementById('picked-label').textContent = label(slot);
    errorEl.hidden = true;
    form.hidden = false;
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // "Book Gold" etc. preselect that package and jump to the schedule.
  [].forEach.call(document.querySelectorAll('[data-tier]'), function (btn) {
    btn.addEventListener('click', function () {
      var radio = form.querySelector('input[name="service"][value="' + btn.getAttribute('data-tier') + '"]');
      if (radio) radio.checked = true;
      document.getElementById('book').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  document.getElementById('change-time').addEventListener('click', function () {
    scheduleEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var body = {};
    fd.forEach(function (v, k) { body[k] = String(v).trim(); });
    body.start = picked && picked.start;

    var missing = !body.service ? 'Pick a package.'
      : !body.name ? 'Enter your name.'
      : body.phone.replace(/\D/g, '').length < 10 ? 'Enter a 10 digit phone number.'
      : !body.address ? 'Enter the street address.'
      : !body.city ? 'Enter your city.'
      : !/^\d{5}(-\d{4})?$/.test(body.zip) ? 'Enter a 5 digit ZIP code.'
      : !body.start ? 'Pick a time above.' : '';
    if (missing) { showError(missing); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Booking...';
    // text/plain keeps this a simple request, which Apps Script accepts cross-origin.
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.error || 'Booking failed. Please try again.');
        form.hidden = true;
        scheduleEl.hidden = true;
        document.getElementById('tz-note').hidden = true;
        document.getElementById('done-label').textContent = label(picked);
        doneEl.hidden = false;
        doneEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })
      .catch(function (err) {
        showError(err.message && err.message !== 'Failed to fetch' ? err.message : 'Booking failed. Please try again.');
        picked = null;
        form.hidden = true;
        load();
      })
      .then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Book this time';
      });
  });

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
    if (form.hidden) {
      // Error after a refresh: show it above the schedule.
      var p = document.createElement('p');
      p.className = 'error';
      p.setAttribute('role', 'alert');
      p.textContent = msg;
      scheduleEl.parentNode.insertBefore(p, scheduleEl);
      setTimeout(function () { p.remove(); }, 8000);
    }
  }

  load();
})();
