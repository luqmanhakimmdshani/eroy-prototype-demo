// Public demo mode (added by publish/build_pages.py).
(() => {
  document.body.insertAdjacentHTML('afterbegin',
    '<div class="demo-bar" role="note"><span data-en="&lt;b&gt;DEMO PROTOTYPE&lt;/b&gt; — not an official KBS / ROY website. Do not enter real personal information.">' +
    '<b>PROTOTAIP DEMO</b> — bukan laman rasmi KBS / ROY. Jangan masukkan maklumat peribadi sebenar.</span></div>');
  const footer = document.getElementById('footer');
  if (footer) footer.innerHTML = '<span data-en="Demo prototype for design discussion. Not affiliated with KBS or ROY.">Prototaip demo untuk perbincangan reka bentuk. Tidak berkaitan dengan KBS atau ROY.</span>';
  // Login, IC and password fields are disabled in the public demo.
  document.querySelectorAll('input[type=password], #ic, #code').forEach(i => {
    i.disabled = true;
    i.placeholder = 'Dinyahaktifkan dalam demo';
    i.closest('form')?.querySelectorAll('button.btn-primary').forEach(b => b.disabled = true);
  });
  // GitHub Pages is static: send /api/* to the public backend tunnel set in assets/config.js
  // (written by publish/start-public.ps1). If it's not set or not reachable, answer with a clear message.
  const API = (window.EROY_API || '').replace(/\/$/, '');
  const offline = () => new Response(JSON.stringify({ error: 'Ciri AI sedang luar talian. / AI is offline right now.' }),
    { status: 503, headers: { 'Content-Type': 'application/json' } });
  const realFetch = window.fetch.bind(window);
  window.fetch = (url, opts = {}) => {
    const u = String(url);
    if (!u.startsWith('/api/')) return realFetch(url, opts);
    if (!API) return Promise.resolve(offline());
    const headers = { ...(opts.headers || {}), 'ngrok-skip-browser-warning': '1' };  // skip ngrok's interstitial page
    return realFetch(API + u, { ...opts, headers }).then(r => (r.status >= 500 && r.status !== 503 ? offline() : r)).catch(offline);
  };
  // Show AI status in the demo bar.
  const bar = document.querySelector('.demo-bar');
  const status = document.createElement('span');
  status.className = 'demo-ai';
  bar.append(' ', status);
  fetch('/api/health').then(r => r.ok).catch(() => false).then(on => {
    const en = document.documentElement.lang === 'en';
    status.textContent = on ? (en ? '● AI online' : '● AI dalam talian') : (en ? '○ AI offline' : '○ AI luar talian');
    status.classList.toggle('on', on);
  });
})();
