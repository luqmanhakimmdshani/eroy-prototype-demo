// Eligibility + document rules from the eROY user manual and the sign-up page. Pure functions, no DOM.
// Each result: { ok: true | false | 'warn', ms, en, src }  (src = manual anchor or site page)
const MANUAL = 'https://eroy.kbs.gov.my/manualpengguna/Manual_Pengguna_eroy2.html';

function checkEligibility(a) {
  const r = [];
  const add = (ok, ms, en, src) => r.push({ ok, ms, en, src });

  const lead = a.role === 'Setiausaha' || a.role === 'Pengerusi';
  add(lead,
    lead ? `Anda ${a.role} — dibenarkan mengemukakan permohonan.` : 'Hanya Setiausaha atau Pengerusi boleh mengemukakan permohonan.',
    lead ? `You are the ${a.role === 'Pengerusi' ? 'Chairperson' : 'Secretary'} — you may submit the application.` : 'Only the Secretary or Chairperson may submit the application.',
    'daftar.html');

  const age = Number(a.age);
  const ageOk = age >= 18 && age <= 30;
  add(ageOk,
    ageOk ? `Umur ${age} tahun — dalam had 18 hingga 30 tahun.` : `Umur ${age || '?'} tahun — pemegang jawatan mesti berumur 18 hingga 30 tahun.`,
    ageOk ? `Age ${age} — within the 18 to 30 limit.` : `Age ${age || '?'} — office holders must be aged 18 to 30.`,
    `${MANUAL}#section-5-4`);

  const n = Number(a.members);
  const membersOk = n >= 7;
  add(membersOk,
    membersOk ? `${n} ahli jawatankuasa penaja — memenuhi minimum 7 orang.` : `${n || 0} ahli jawatankuasa penaja — minimum 7 orang diperlukan (kurang ${7 - (n || 0)}).`,
    membersOk ? `${n} sponsor committee members — meets the minimum of 7.` : `${n || 0} sponsor committee members — at least 7 are needed (${7 - (n || 0)} short).`,
    `${MANUAL}#section-5-4`);

  add(a.inAjk === 'yes',
    a.inAjk === 'yes' ? 'Jawatan anda sepadan dengan AJK Penaja.' : 'Jawatan anda mesti didaftarkan dalam AJK Penaja.',
    a.inAjk === 'yes' ? 'Your position matches the Sponsor Committee.' : 'Your position must be registered in the Sponsor Committee (AJK Penaja).',
    'daftar.html');

  const need = { Kebangsaan: 6, Negeri: 3 }[a.level];
  if (need) {
    const b = Number(a.branches);
    add(b >= need ? true : 'warn',
      b >= need ? `${b} cawangan/badan gabungan — memenuhi minimum ${need} bagi peringkat ${a.level}.`
        : `Peringkat ${a.level} memerlukan minimum ${need} cawangan/badan gabungan (anda ada ${b || 0}). Pertubuhan diberi 2 tahun dari kelulusan bersyarat untuk memenuhinya.`,
      b >= need ? `${b} branches/affiliates — meets the minimum of ${need} for ${a.level === 'Negeri' ? 'state' : 'national'} level.`
        : `${a.level === 'Negeri' ? 'State' : 'National'} level needs at least ${need} branches/affiliates (you have ${b || 0}). Organisations get 2 years from conditional approval to meet this.`,
      `${MANUAL}#bab2`);
  }

  if (a.role === 'Setiausaha') {
    add('warn', 'Pengerusi juga perlu mendaftar akaun sendiri untuk mengesahkan permohonan anda (Peraku 2).',
      'The Chairperson also needs their own account to confirm your application (second certifier).', `${MANUAL}#bab3`);
  }
  return { eligible: r.every(x => x.ok !== false), results: r };
}

// Document slots. Size limit: the manual says 5MB per file (Tab E) but 10MB in the FAQ; we use the stricter 5MB.
const MB = 1024 * 1024;
const fmtSize = b => b < 0.1 * MB ? `${Math.max(1, Math.round(b / 1024))}KB` : `${(b / MB).toFixed(1)}MB`;
const DOC_SLOTS = [
  { id: 'minit', ms: 'Minit Mesyuarat Penubuhan', en: 'Founding meeting minutes', types: ['pdf'], required: true },
  { id: 'kehadiran', ms: 'Senarai Kehadiran mesyuarat', en: 'Meeting attendance list', types: ['pdf'], required: true },
  { id: 'perlembagaan', ms: 'Perlembagaan (ditandatangani)', en: 'Constitution (signed)', types: ['pdf'], required: true },
  { id: 'kp_pengerusi', ms: 'Salinan KP Pengerusi', en: 'Chairperson IC copy', types: ['pdf', 'jpg', 'png'], required: true },
  { id: 'kp_setiausaha', ms: 'Salinan KP Setiausaha', en: 'Secretary IC copy', types: ['pdf', 'jpg', 'png'], required: true },
  { id: 'kp_bendahari', ms: 'Salinan KP Bendahari', en: 'Treasurer IC copy', types: ['pdf', 'jpg', 'png'], required: true },
  { id: 'logo', ms: 'Logo Pertubuhan (pilihan)', en: 'Organisation logo (optional)', types: ['jpg', 'png'], required: false },
];
const MAGIC = { pdf: [0x25, 0x50, 0x44, 0x46], png: [0x89, 0x50, 0x4e, 0x47], jpg: [0xff, 0xd8, 0xff], zip: [0x50, 0x4b, 0x03, 0x04] };
// What a file really is, from its first bytes (Word .docx files are zip archives).
const KIND_NAMES = { pdf: ['dokumen PDF', 'a PDF document'], png: ['gambar PNG', 'a PNG picture'], jpg: ['gambar JPG', 'a JPG picture'],
                     zip: ['dokumen Word / fail zip', 'a Word document / zip file'] };
const sniff = head => Object.keys(MAGIC).find(k => MAGIC[k].every((b, i) => head[i] === b)) || null;

// f = { name, size, head: Uint8Array (first bytes), width?, height? }
// Each issue: { ok, ms, en } plus, when something is wrong, { fixMs, fixEn }: how to put it right.
function checkFile(f, slot) {
  const issues = [];
  const add = (ok, ms, en, fixMs, fixEn) => issues.push({ ok, ms, en, ...(fixMs ? { fixMs, fixEn } : {}) });
  const ext = (f.name.split('.').pop() || '').toLowerCase().replace('jpeg', 'jpg');
  const allowed = slot.types.map(t => t.toUpperCase()).join('/');
  const pdfOnly = slot.types.length === 1 && slot.types[0] === 'pdf';
  const real = sniff(f.head);
  if (!slot.types.includes(ext)) {
    add(false, `Ditolak: format mesti ${allowed} (fail anda .${ext}).`, `Rejected: format must be ${allowed} (your file is .${ext}).`,
      pdfOnly ? 'Buka dokumen dan simpan semula sebagai PDF (Fail > Simpan Sebagai > PDF), kemudian masukkan semula.'
              : `Simpan atau eksport semula dalam format ${allowed}, kemudian masukkan semula.`,
      pdfOnly ? 'Open the document and save it again as PDF (File > Save As > PDF), then add it again.'
              : `Save or export it again as ${allowed}, then add it again.`);
  } else if (f.size > 0 && real !== ext) {
    const what = real ? KIND_NAMES[real] : ['fail yang rosak atau format lain', 'a damaged file or another format'];
    add(false, `Ditolak: fail ini sebenarnya ${what[0]} yang dinamakan .${ext}.`, `Rejected: this file is actually ${what[1]} named .${ext}.`,
      `Menukar nama sambungan tidak menukar format. Eksport atau cetak semula dokumen asal sebagai ${ext.toUpperCase()}.`,
      `Renaming the extension doesn't change the format. Export or print the original again as ${ext.toUpperCase()}.`);
  }
  if (f.size === 0) {
    add(false, 'Ditolak: fail kosong.', 'Rejected: the file is empty.',
      'Imbas atau muat turun semula dokumen, kemudian masukkan semula.', 'Scan or download the document again, then add it again.');
  } else if (f.size > 5 * MB) {
    add(false, `Ditolak: saiz ${(f.size / MB).toFixed(1)}MB melebihi had 5MB.`, `Rejected: size ${(f.size / MB).toFixed(1)}MB exceeds the 5MB limit.`,
      'Kecilkan saiz: imbas semula pada resolusi lebih rendah (150–200 dpi) atau mampatkan PDF, kemudian masukkan semula.',
      'Make it smaller: scan again at a lower resolution (150–200 dpi) or compress the PDF, then add it again.');
  }
  if (slot.id === 'logo' && f.width && (f.width < 500 || f.height < 500 || f.width !== f.height)) {
    add('warn', `Amaran: resolusi ${f.width}x${f.height}; disyorkan 500x500 piksel.`, `Warning: resolution ${f.width}x${f.height}; 500x500 pixels is recommended.`,
      'Boleh diterima, tetapi gunakan logo segi empat sama sekurang-kurangnya 500x500 piksel supaya jelas pada sijil.',
      'Accepted, but use a square logo of at least 500x500 pixels so it stays sharp.');
  }
  if (!issues.length) add(true, `Sedia untuk dimuat naik (${fmtSize(f.size)}).`, `Ready to upload (${fmtSize(f.size)}).`);
  return { ok: issues.every(i => i.ok !== false), issues };
}

// Work out which required document a file is. f = { name, text? } where text is the PDF's extracted text
// (empty for images and scanned PDFs). Content wins over the file name because names are often "scan001.pdf".
// Returns { slot: id | null, by: 'content' | 'name' | null }.
// ponytail: keyword scoring; swap for an AI/vision classifier if real-world files are often misread.
const DOC_SIGNS = {
  minit: [/minit\s+mesyuarat/i, /minutes\s+of\s+(the\s+)?meeting/i, /dicadangkan\s+oleh/i, /disokong\s+oleh/i,
    /mesyuarat\s+(di)?tangguhkan/i, /\bagenda\b/i, /\bminit\b/i, /\bminutes\b/i],
  kehadiran: [/senarai\s+kehadiran/i, /attendance\s+(list|sheet)/i, /\bkehadiran\b/i, /\battendance\b/i],
  perlembagaan: [/perlembagaan/i, /undang[-\s]undang\s+tubuh/i, /\bconstitution\b/i, /\bfasal\s+\d+/i, /\bclause\s+\d+/i],
  kp: [/kad\s+pengenalan/i, /\bmykad\b/i, /identity\s+card/i, /\bwarganegara\b/i],
  logo: [/\blogo\b/i],
};
const ROLE_SIGNS = {
  kp_pengerusi: /pengerusi|chair(man|person)?|presiden/i,
  kp_setiausaha: /setiausaha|secretary|\bsu\b/i,
  kp_bendahari: /bendahari|treasurer/i,
};

function classifyDoc(f) {
  const name = f.name.replace(/[_\-.]+/g, ' ');
  const score = (txt, k) => DOC_SIGNS[k].reduce((n, re, i) => n + (re.test(txt) ? (i < 2 ? 3 : 1) : 0), 0);
  const best = txt => {
    const ranked = Object.keys(DOC_SIGNS).map(k => [k, score(txt, k)]).sort((a, b) => b[1] - a[1]);
    return ranked[0][1] > 0 && ranked[0][1] > ranked[1][1] ? ranked[0][0] : null;
  };
  // IC copies also need the role; take it from the name first, then from the text.
  const role = () => Object.keys(ROLE_SIGNS).find(id => ROLE_SIGNS[id].test(name))
    || Object.keys(ROLE_SIGNS).find(id => ROLE_SIGNS[id].test(f.text || '')) || null;
  const nameKind = best(name.replace(/\bkp\b|\bic\b/i, ' kad pengenalan '));
  for (const [kind, by] of [[f.text && f.text.trim().length > 30 ? best(f.text) : null, 'content'], [nameKind, 'name']]) {
    if (!kind) continue;
    if (kind !== 'kp') return { slot: kind, by };
    const r = role();
    return { slot: r, by: r ? by : null, kind: 'kp' };  // an IC copy whose role isn't known yet
  }
  return { slot: null, by: null };
}

if (typeof module !== 'undefined') module.exports = { checkEligibility, checkFile, classifyDoc, DOC_SLOTS };
