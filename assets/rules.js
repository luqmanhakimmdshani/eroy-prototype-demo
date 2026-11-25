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
  { id: 'minit', ms: 'Minit Mesyuarat Penubuhan', en: 'Founding meeting minutes', types: ['pdf'], required: true, checklist: 2 },
  { id: 'kehadiran', ms: 'Senarai Kehadiran mesyuarat', en: 'Meeting attendance list', types: ['pdf'], required: true, checklist: 3 },
  { id: 'perlembagaan', ms: 'Perlembagaan (ditandatangani)', en: 'Constitution (signed)', types: ['pdf'], required: true, checklist: 4 },
  { id: 'kp_pengerusi', ms: 'Salinan KP Pengerusi', en: 'Chairperson IC copy', types: ['pdf', 'jpg', 'png'], required: true, checklist: 5 },
  { id: 'kp_setiausaha', ms: 'Salinan KP Setiausaha', en: 'Secretary IC copy', types: ['pdf', 'jpg', 'png'], required: true, checklist: 5 },
  { id: 'kp_bendahari', ms: 'Salinan KP Bendahari', en: 'Treasurer IC copy', types: ['pdf', 'jpg', 'png'], required: true, checklist: 5 },
  { id: 'logo', ms: 'Logo Pertubuhan (pilihan)', en: 'Organisation logo (optional)', types: ['jpg', 'png'], required: false },
];
const MAGIC = { pdf: [0x25, 0x50, 0x44, 0x46], png: [0x89, 0x50, 0x4e, 0x47], jpg: [0xff, 0xd8, 0xff] };

// f = { name, size, head: Uint8Array (first bytes), width?, height? }
function checkFile(f, slot) {
  const issues = [];
  const add = (ok, ms, en) => issues.push({ ok, ms, en });
  const ext = (f.name.split('.').pop() || '').toLowerCase().replace('jpeg', 'jpg');
  const allowed = slot.types.map(t => t.toUpperCase()).join('/');
  if (!slot.types.includes(ext)) add(false, `Format mesti ${allowed} (fail anda .${ext}).`, `Format must be ${allowed} (your file is .${ext}).`);
  else if (!(MAGIC[ext] || []).every((b, i) => f.head[i] === b)) add(false, `Kandungan fail bukan ${ext.toUpperCase()} sebenar — mungkin rosak atau dinamakan semula.`, `File content is not a real ${ext.toUpperCase()} — it may be corrupt or renamed.`);
  if (f.size === 0) add(false, 'Fail kosong.', 'File is empty.');
  else if (f.size > 5 * MB) add(false, `Saiz ${(f.size / MB).toFixed(1)}MB melebihi had 5MB.`, `Size ${(f.size / MB).toFixed(1)}MB exceeds the 5MB limit.`);
  if (slot.id === 'logo' && f.width && (f.width < 500 || f.height < 500 || f.width !== f.height)) {
    add('warn', `Resolusi ${f.width}x${f.height}; disyorkan 500x500 piksel.`, `Resolution ${f.width}x${f.height}; 500x500 pixels is recommended.`);
  }
  if (!issues.length) add(true, `Sedia untuk dimuat naik (${fmtSize(f.size)}).`, `Ready to upload (${fmtSize(f.size)}).`);
  return { ok: issues.every(i => i.ok !== false), issues };
}

if (typeof module !== 'undefined') module.exports = { checkEligibility, checkFile, DOC_SLOTS };
