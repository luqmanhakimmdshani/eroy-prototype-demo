// AI features: chat assistant with manual sources, feedback and voice (all pages),
// Other pages call window.eroyAsk(question); the search page calls /api/search itself.
(() => {
  const page = (location.pathname.split('/').pop().replace('.html', '') || 'index');
  const lang = () => document.documentElement.lang === 'en' ? 'en' : 'ms';  // set by i18n.js
  const KEY = 'eroy-chat';
  let history = [];
  try { history = JSON.parse(sessionStorage.getItem(KEY)) || []; } catch {}
  const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(history)); } catch {} };
  const post = (url, body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  document.body.insertAdjacentHTML('beforeend', `
    <button id="ai-fab" class="btn btn-warning" aria-label="Buka Pembantu eROY"><span class="glyphicon glyphicon-comment"></span> Tanya AI</button>
    <section id="ai-panel" class="panel panel-default" hidden aria-label="Pembantu eROY">
      <div class="panel-heading" id="ai-head"><b>Pembantu eROY</b> <small>(AI)</small>
        <button type="button" class="close" id="ai-close" aria-label="Tutup" title="Tutup">&times;</button>
        <button type="button" class="close" id="ai-min" aria-label="Kecilkan" title="Kecilkan" aria-expanded="true">&minus;</button></div>
      <div id="ai-log" aria-live="polite" data-no-i18n></div>
      <div id="ai-chips"></div>
      <form id="ai-form" class="ai-input" data-live="1">
        <input id="ai-q" class="form-control" placeholder="Tanya tentang pendaftaran..." autocomplete="off" maxlength="1000">
        <button type="button" class="btn btn-default" id="ai-mic" hidden aria-label="Cakap" title="Cakap / Speak">🎤</button>
        <button class="btn btn-primary" aria-label="Hantar"><span class="glyphicon glyphicon-send"></span></button>
      </form>
      <div class="ai-note">Jawapan AI mungkin tidak tepat. Jangan kongsi katalaluan.</div>
    </section>`);

  const $ = id => document.getElementById(id);
  // Render **bold** as <b>, everything else as plain text nodes: model output is never parsed as HTML.
  const show = (el, text) => el.replaceChildren(...text.split(/\*\*(.+?)\*\*/g)
    .map((s, i) => i % 2 ? Object.assign(document.createElement('b'), { textContent: s }) : s));
  const bubble = (role, text) => {
    const d = document.createElement('div');
    d.className = 'ai-msg ai-' + role;
    show(d, text);
    $('ai-log').append(d);
    $('ai-log').scrollTop = 1e9;
    return d;
  };
  // Numbered source links under an answer (links come from our server's manual index, opened in a new tab).
  const addSources = (el, sources) => {
    if (!sources?.length) return;
    const box = document.createElement('div');
    box.className = 'ai-sources';
    box.append(lang() === 'en' ? 'Sources: ' : 'Sumber: ');
    sources.forEach(s => {
      if (!/^https:\/\/eroy\.kbs\.gov\.my\//.test(s.url)) return;
      const a = Object.assign(document.createElement('a'), { href: s.url, target: '_blank', rel: 'noopener', textContent: `[${s.n}] ${s.title}` });
      box.append(a, ' ');
    });
    el.after(box);
  };
  // 👍/👎 on each new answer, logged server-side to feedback.jsonl.
  const addFeedback = (el, question, answer) => {
    const box = document.createElement('div');
    box.className = 'ai-feedback';
    for (const [rating, icon, label] of [['up', '👍', 'Membantu'], ['down', '👎', 'Tidak membantu']]) {
      const b = Object.assign(document.createElement('button'), { type: 'button', className: 'btn btn-link btn-xs', textContent: icon, title: label });
      b.setAttribute('aria-label', label);
      b.onclick = () => {
        post('/api/feedback', { rating, page, question, answer }).catch(() => {});
        box.textContent = lang() === 'en' ? 'Thanks for the feedback.' : 'Terima kasih atas maklum balas.';
      };
      box.append(b);
    }
    (el.nextElementSibling?.classList.contains('ai-sources') ? el.nextElementSibling : el).after(box);
  };
  // Minimised = only the title bar stays docked; clicking the bar or the button restores it.
  const minimise = on => {
    $('ai-panel').classList.toggle('ai-minimised', on);
    $('ai-min').setAttribute('aria-expanded', String(!on));
    $('ai-min').innerHTML = on ? '&#9633;' : '&minus;';  // □ restore / − minimise
  };
  const open = () => { $('ai-panel').hidden = false; $('ai-fab').hidden = true; minimise(false); $('ai-q').focus(); };
  $('ai-fab').onclick = open;
  $('ai-close').onclick = () => { $('ai-panel').hidden = true; $('ai-fab').hidden = false; };
  $('ai-min').onclick = e => { e.stopPropagation(); minimise(!$('ai-panel').classList.contains('ai-minimised')); };
  $('ai-head').onclick = e => { if (!e.target.closest('button') && $('ai-panel').classList.contains('ai-minimised')) open(); };

  if (!history.length) bubble('assistant', 'Selamat datang! Saya boleh bantu tentang pendaftaran pertubuhan belia, akaun pengguna dan carian. / Ask me in English too.');
  history.forEach(m => { const d = bubble(m.role, m.content); addSources(d, m.sources); });
  ['Bagaimana nak daftar pertubuhan?', 'Siapa boleh buat permohonan?', 'What does "Kuiri Pendaftaran" mean?']
    .forEach(t => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-default btn-xs'; b.textContent = t; b.onclick = () => ask(b.textContent); $('ai-chips').append(b); });

  let busy = false;
  async function ask(text, shown = text) {
    if (busy || !text.trim()) return;
    busy = true; open();
    bubble('user', shown);
    history.push({ role: 'user', content: text });
    const out = bubble('assistant', '…');
    try {
      const r = await post('/api/chat', { messages: history.map(({ role, content }) => ({ role, content })), page, lang: lang() });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.statusText);
      let sources = [];
      try { sources = JSON.parse(r.headers.get('X-Sources') || '[]'); } catch {}
      const reader = r.body.getReader(), dec = new TextDecoder();
      let reply = '';
      for (let c; !(c = await reader.read()).done;) {
        // Normalise citation quirks of some models: 【n】 -> [n], drop invented tags like [FAKTA].
        reply = (reply + dec.decode(c.value, { stream: true })).replace(/【(\d+)】/g, '[$1]').replace(/ ?\[FAKTA\]/gi, '');
        show(out, reply); $('ai-log').scrollTop = 1e9;
      }
      // Only list sources the answer actually cites ([n]), keeping their original numbers.
      const cited = sources.map((s, i) => ({ ...s, n: i + 1 })).filter(s => reply.includes(`[${s.n}]`));
      history.push({ role: 'assistant', content: reply, sources: cited });
      save();
      addSources(out, cited);
      addFeedback(out, text, reply);
      $('ai-log').scrollTop = 1e9;
    } catch (e) {
      history.pop();  // drop the unanswered question so the next request stays valid
      out.textContent = 'Ralat: ' + e.message;
      out.classList.add('text-danger');
    }
    busy = false;
  }
  window.eroyAsk = ask;
  $('ai-form').onsubmit = e => { e.preventDefault(); const q = $('ai-q').value; $('ai-q').value = ''; ask(q); };

  // Voice input (browser speech recognition; hidden where unsupported). Language follows the site language.
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) {
    const mic = $('ai-mic');
    mic.hidden = false;
    let rec = null;
    mic.onclick = () => {
      if (rec) return rec.stop();
      rec = new SR();
      rec.lang = lang() === 'en' ? 'en-US' : 'ms-MY';
      rec.interimResults = true;
      mic.classList.add('btn-danger');
      rec.onresult = e => { $('ai-q').value = [...e.results].map(r => r[0].transcript).join(''); };
      rec.onend = () => { mic.classList.remove('btn-danger'); rec = null; if ($('ai-q').value.trim()) $('ai-form').requestSubmit(); };
      rec.onerror = () => { $('ai-q').placeholder = lang() === 'en' ? 'Microphone unavailable' : 'Mikrofon tidak tersedia'; };
      rec.start();
    };
  }

})();
