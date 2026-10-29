(function () {
  var API = window.KLEER_BOOKING_URL;
  var dialog = document.getElementById('quote');
  var form = document.getElementById('quote-form');
  var done = document.getElementById('quote-done');
  var errorEl = document.getElementById('quote-error');
  var submitBtn = document.getElementById('quote-submit');
  if (!dialog || !form) return;

  function open(tier) {
    form.hidden = false;
    done.hidden = true;
    errorEl.hidden = true;
    [].forEach.call(form.querySelectorAll('input[name="service"]'), function (r) { r.checked = r.value === tier; });
    dialog.showModal();
    document.body.classList.add('modal-open');
    setTimeout(function () { form.address.focus(); }, 50);
  }

  function close() { dialog.close(); }
  dialog.addEventListener('close', function () { document.body.classList.remove('modal-open'); });

  [].forEach.call(document.querySelectorAll('[data-quote]'), function (btn) {
    btn.addEventListener('click', function () { open(btn.getAttribute('data-quote')); });
  });
  document.getElementById('quote-close').addEventListener('click', close);
  document.getElementById('quote-done-close').addEventListener('click', close);
  // Click on the backdrop closes it.
  dialog.addEventListener('click', function (e) { if (e.target === dialog) close(); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var body = { type: 'quote' };
    new FormData(form).forEach(function (v, k) { body[k] = String(v).trim(); });

    var missing = !body.address ? 'Enter your street address.'
      : !body.city ? 'Enter your city.'
      : !/^\d{5}(-\d{4})?$/.test(body.zip) ? 'Enter a 5 digit ZIP code.'
      : !body.name ? 'Enter your name.'
      : body.phone.replace(/\D/g, '').length < 10 ? 'Enter a 10 digit phone number.' : '';
    if (missing) { errorEl.textContent = missing; errorEl.hidden = false; return; }
    if (!API) { errorEl.textContent = 'Quotes are not connected yet. Please try again soon.'; errorEl.hidden = false; return; }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.error);
        form.reset();
        form.hidden = true;
        done.hidden = false;
      })
      .catch(function (err) {
        errorEl.textContent = (err && err.message && err.message !== 'Failed to fetch') ? err.message : 'Could not send. Please try again.';
        errorEl.hidden = false;
      })
      .then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send my quote request';
      });
  });
})();
