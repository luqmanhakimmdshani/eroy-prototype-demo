// Public demo mode (added by publish/build_pages.py).
(() => {
  document.body.insertAdjacentHTML('afterbegin',
    '<div class="demo-bar" role="note" data-en="&lt;b&gt;DEMO PROTOTYPE&lt;/b&gt; — not an official KBS / ROY website. Do not enter real personal information. AI features need the local server.">' +
    '<b>PROTOTAIP DEMO</b> — bukan laman rasmi KBS / ROY. Jangan masukkan maklumat peribadi sebenar. Ciri AI memerlukan pelayan tempatan.</div>');
  const footer = document.getElementById('footer');
  if (footer) footer.innerHTML = '<span data-en="Demo prototype for design discussion. Not affiliated with KBS or ROY.">Prototaip demo untuk perbincangan reka bentuk. Tidak berkaitan dengan KBS atau ROY.</span>';
  // Login, IC and password fields are disabled in the public demo.
  document.querySelectorAll('input[type=password], #ic, #code').forEach(i => {
    i.disabled = true;
    i.placeholder = 'Dinyahaktifkan dalam demo';
    i.closest('form')?.querySelectorAll('button.btn-primary').forEach(b => b.disabled = true);
  });
  // GitHub Pages is static: answer AI routes locally instead of failing with a confusing error.
  const realFetch = window.fetch.bind(window);
  window.fetch = (url, opts) => String(url).includes('/api/')
    ? Promise.resolve(new Response(JSON.stringify({ error: 'Ciri AI hanya berfungsi pada pelayan tempatan (demo statik). / AI needs the local server.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }))
    : realFetch(url, opts);
})();
