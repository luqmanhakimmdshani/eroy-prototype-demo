// BM/EN language switch for the whole site.
// - Plain text nodes and placeholder/title/aria-label attributes are matched (trimmed) against EN below.
// - Mixed-markup blocks carry their English HTML in data-en (static, authored strings only).
// - Dropdown <option>s keep their BM value so filters keep working; only the visible text changes.
// - Anything inside [data-no-i18n] (e.g. AI chat log) is left alone.
(() => {
  const EN = {
    // navigation, layout
    'Log Masuk': 'Log In', 'Daftar Pengguna': 'Register User', 'Lupa Katalaluan': 'Forgot Password', 'Carian': 'Search',
    'Carian Umum': 'Public Search', 'Permohonan Baru': 'New Application', 'Semak Status Permohonan': 'Check Application Status',
    'Sistem Pendaftaran Pertubuhan Belia': 'Youth Organisation Registration System',
    'Pejabat Pendaftar Pertubuhan Belia.': 'Registrar of Youth Organisations Office.', '(Prototaip tempatan)': '(Local prototype)',
    'Prototaip sahaja — tiada data dihantar.': 'Prototype only — no data was sent.', 'Senarai': 'List',
    // home: wizard, checklist, manual, login
    'Daftarkan pertubuhan belia anda secara atas talian dalam 5 langkah:': 'Register your youth organisation online in 5 steps:',
    'Daftar Akaun': 'Create Account', 'Sahkan Emel': 'Verify Email', 'Isi Permohonan': 'Fill In Application',
    'Pengesahan Pengerusi': 'Chairperson Confirmation', 'Bayaran & Kelulusan': 'Payment & Approval',
    '« Kembali': '« Back', 'Seterusnya »': 'Next »', 'Sediakan sebelum mula': 'Prepare before you start',
    'Sekurang-kurangnya 7 orang ahli jawatankuasa penaja': 'At least 7 sponsor committee members',
    'Pemegang jawatan berumur 18 hingga 30 tahun': 'Office holders aged 18 to 30',
    'Minit Mesyuarat Penubuhan (PDF, ditandatangani)': 'Founding meeting minutes (PDF, signed)',
    'Senarai Kehadiran mesyuarat (PDF)': 'Meeting attendance list (PDF)',
    'Perlembagaan yang telah ditandatangani (PDF)': 'Signed constitution (PDF)',
    'Salinan KP Pengerusi, Setiausaha dan Bendahari': 'IC copies of Chairperson, Secretary and Treasurer',
    'Emel dan No. telefon yang aktif': 'Active email and phone number',
    'Sumber: Manual Pengguna eROY, Bab 5.': 'Source: eROY User Manual, Chapter 5.',
    'Manual Pengguna': 'User Manual', 'Buka Manual': 'Open Manual',
    'Rujuk manual pengguna untuk panduan penggunaan Sistem Pendaftaran Pertubuhan Belia.': 'See the user manual for a guide to using the Youth Organisation Registration System.',
    'No Kad Pengenalan :': 'IC Number :', 'Katalaluan :': 'Password :', 'No Kad Pengenalan': 'IC Number', 'Katalaluan': 'Password',
    'Papar Katalaluan': 'Show Password', 'Lupa katalaluan?': 'Forgot password?',
    // sign-up
    'DAFTAR PENGGUNA SISTEM': 'SYSTEM USER REGISTRATION', 'PERHATIAN': 'ATTENTION',
    'No.Kad Pengenalan:*': 'IC Number:*', 'Nama Penuh:*': 'Full Name:*', 'Alamat Emel:*': 'Email Address:*',
    'No.Telefon Bimbit:*': 'Mobile Number:*', 'Katalaluan:*': 'Password:*', 'Sahkan Katalaluan:*': 'Confirm Password:*',
    'Kod Pengesahan:*': 'Verification Code:*', 'Daftar': 'Register', 'Kembali': 'Back', 'Semak dengan AI': 'Check with AI',
    'Contoh: 900101011234': 'Example: 900101011234',
    // forgot password
    'Masukkan No. Kad Pengenalan yang didaftarkan. Pautan untuk menetapkan semula katalaluan akan dihantar ke alamat emel anda.':
      'Enter your registered IC number. A password reset link will be sent to your email address.',
    'Hantar': 'Send',
    // search
    'Carian Pertubuhan': 'Organisation Search', 'Senarai Carian Pertubuhan': 'Organisation Search List',
    'No. Pendaftaran Pertubuhan :': 'Registration No. :', 'Nama Pertubuhan :': 'Organisation Name :',
    'Jenis Pertubuhan :': 'Organisation Type :', 'Status Pendaftaran :': 'Registration Status :', 'Peringkat Pertubuhan :': 'Organisation Level :',
    'Sila pilih': 'Please select', 'Cari': 'Search', 'Set Semula': 'Reset', 'Tiada rekod dijumpai.': 'No records found.',
    'No. Pendaftaran Pertubuhan': 'Registration No.', 'Nama Pertubuhan': 'Organisation Name', 'Jenis Pertubuhan': 'Type',
    'Peringkat Pertubuhan': 'Level', 'Status Pendaftaran': 'Status',
    'Carian pintar (AI)': 'Smart search (AI)', 'Cari dengan AI': 'Search with AI', 'Memproses…': 'Processing…',
    'Contoh: majlis belia peringkat negeri yang sudah lulus': 'Example: state-level youth councils that were approved',
    'Terangkan dengan AI': 'Explain with AI', 'Semak status': 'Check status',
    // levels, types, statuses
    'Tunggal': 'Single', 'Kebangsaan': 'National', 'Negeri': 'State', 'Daerah': 'District', 'Bahagian': 'Division',
    'Kawasan': 'Area', 'Lokaliti': 'Locality',
    'Dalam Proses Semakan': 'Under Review', 'Kuiri Pendaftaran': 'Registration Query', 'Menunggu Pembayaran': 'Awaiting Payment',
    'Tolak': 'Rejected', 'Lulus': 'Approved', 'Kelulusan Bersyarat': 'Conditional Approval',
    'Dibenarkan Menubuhkan Cawangan': 'Permitted to Form Branches',
    // secretary change list
    'Permohonan Baru (Pertukaran Setiausaha)': 'New Application (Change of Secretary)', 'Senarai Pertubuhan': 'Organisation List',
    'Tindakan': 'Action', 'Pilih': 'Select',
    // tracker
    'Masukkan No. Pendaftaran Pertubuhan untuk melihat kemajuan permohonan. Tidak perlu log masuk.':
      'Enter the organisation registration number to see the application progress. No login needed.',
    'Contoh: PPPM-01003': 'Example: PPPM-01003', 'Semak': 'Check', 'Cuba contoh:': 'Try an example:', 'Status semasa:': 'Current status:',
    'Permohonan Dihantar (Setiausaha)': 'Application Submitted (Secretary)', 'Keputusan': 'Decision',
    'Terangkan status ini dengan AI': 'Explain this status with AI',
    'Tiada permohonan dijumpai bagi nombor ini.': 'No application found for this number.',
    // AI widget
    'Tanya AI': 'Ask AI', 'Pembantu eROY': 'eROY Assistant', 'Tanya tentang pendaftaran...': 'Ask about registration...',
    'Jawapan AI mungkin tidak tepat. Jangan kongsi katalaluan.': 'AI answers may be inaccurate. Never share your password.',
    'Bagaimana nak daftar pertubuhan?': 'How do I register an organisation?', 'Siapa boleh buat permohonan?': 'Who can apply?',
    'Buka Pembantu eROY': 'Open eROY Assistant', 'Tutup': 'Close', 'Kecilkan': 'Minimise', 'Cakap': 'Speak',
    // menus (new)
    'Panduan': 'Guides', 'Semak Kelayakan': 'Eligibility Check', 'Semakan Dokumen': 'Document Check',
    // eligibility
    'Jawab 5 soalan ringkas untuk mengetahui sama ada anda boleh mengemukakan permohonan pendaftaran pertubuhan belia.':
      'Answer 5 short questions to find out whether you can submit a youth organisation registration.',
    'Jawatan anda dalam pertubuhan': 'Your position in the organisation', 'Umur anda': 'Your age',
    'Bilangan ahli jawatankuasa penaja': 'Number of sponsor committee members',
    'Jawatan anda didaftarkan dalam AJK Penaja?': 'Is your position registered in the Sponsor Committee?',
    'Ya': 'Yes', 'Tidak': 'No', 'Peringkat pertubuhan': 'Organisation level',
    'Bilangan cawangan / badan gabungan': 'Number of branches / affiliates', 'Semak kelayakan': 'Check eligibility',
    'Setiausaha': 'Secretary', 'Pengerusi': 'Chairperson', 'Bendahari': 'Treasurer', 'AJK lain': 'Other committee member',
    // documents
    'Semakan Dokumen Sebelum Memohon': 'Document Check Before Applying',
    'Seret semua dokumen ke sini': 'Drag all your documents here',
    'atau klik untuk memilih fail (PDF, JPG, PNG)': 'or click to choose files (PDF, JPG, PNG)',
    'Dokumen diperlukan': 'Required documents', 'Fail anda': 'Your files', 'Kosongkan semua': 'Clear all',
    'Belum ada fail dipilih.': 'No files chosen yet.',
    'Manual Pengguna eROY, Bab 5.2, 5.5–5.7, 11.1': 'eROY User Manual, Chapters 5.2, 5.5–5.7, 11.1', 'Sumber:': 'Source:',
    // page titles
    'Sistem eROY': 'eROY System', 'Permohonan Pertukaran Setiausaha': 'Change of Secretary Application',
  };
  const ATTRS = ['placeholder', 'title', 'aria-label'];
  const orig = new WeakMap();  // text node -> original BM text
  let lang = 'ms';
  try { lang = localStorage.getItem('eroy-lang') === 'en' ? 'en' : 'ms'; } catch {}

  const skipped = el => el?.closest('[data-no-i18n], script, style');
  const tr = s => { const k = s.trim(); return lang === 'en' && EN[k] ? s.replace(k, EN[k]) : s; };

  function apply(root) {
    if (root.nodeType === 3) return text(root);
    if (root.nodeType !== 1 || skipped(root)) return;
    root.querySelectorAll('option:not([value])').forEach(o => o.value = o.textContent);
    [root, ...root.querySelectorAll('[data-en]')].filter(el => el.dataset?.en && !skipped(el)).forEach(el => {
      el.dataset.ms ??= el.innerHTML;
      el.innerHTML = lang === 'en' ? el.dataset.en : el.dataset.ms;
    });
    [root, ...root.querySelectorAll('*')].forEach(el => {
      if (skipped(el)) return;
      for (const a of ATTRS) {
        if (!el.hasAttribute(a)) continue;
        const key = 'i18n' + a.replace('-', '');
        el.dataset[key] ??= el.getAttribute(a);
        el.setAttribute(a, tr(el.dataset[key]));
      }
    });
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode());) text(n);
  }
  function text(n) {
    if (!n.nodeValue.trim() || skipped(n.parentElement)) return;
    if (!orig.has(n)) orig.set(n, n.nodeValue);
    const v = tr(orig.get(n));
    if (n.nodeValue !== v) n.nodeValue = v;
  }

  const baseTitle = document.title;
  function set(l) {
    lang = l;
    try { localStorage.setItem('eroy-lang', l); } catch {}
    document.documentElement.lang = l === 'en' ? 'en' : 'ms';
    document.documentElement.classList.toggle('lang-en-on', l === 'en');
    document.title = baseTitle.split(' - ').map(tr).join(' - ');
    apply(document.body);
    document.dispatchEvent(new Event('langchange'));  // pages with their own bilingual output re-render
  }

  // Translate anything rendered later (search results, tracker, AI widget) while EN is on.
  new MutationObserver(ms => lang === 'en' && ms.forEach(m => m.addedNodes.forEach(apply)))
    .observe(document.body, { childList: true, subtree: true });

  const toggle = document.getElementById('lang-toggle');
  if (toggle) toggle.onclick = e => { e.preventDefault(); set(lang === 'en' ? 'ms' : 'en'); };
  set(lang);
})();
