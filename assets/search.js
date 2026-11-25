// One-box search: understand a plain query locally (registration number, status, level, name words),
// and only hand it to the AI when words are left that we can't place. Pure functions, no DOM.
// ponytail: keyword lists, not NLP; anything they don't cover falls through to the AI route.

const STATUS_WORDS = [  // longest / most specific first
  [/lulus\s+bersyarat|kelulusan\s+bersyarat|conditional(ly)?(\s+approv\w*)?/, 'Kelulusan Bersyarat'],
  [/(dibenarkan\s+)?(menubuhkan\s+)?cawangan|branch(es)?\s+(allowed|permitted)|permitted\s+to\s+form\s+branch(es)?/, 'Dibenarkan Menubuhkan Cawangan'],
  [/(dalam\s+)?proses\s+semakan|dalam\s+semakan|under\s+review|being\s+reviewed|in\s+review/, 'Dalam Proses Semakan'],
  [/kuiri(\s+pendaftaran)?|quer(y|ies)|queried/, 'Kuiri Pendaftaran'],
  [/(menunggu\s+)?(pem)?bayaran|belum\s+bayar|awaiting\s+payment|unpaid|payment/, 'Menunggu Pembayaran'],
  [/di?tolak|rejected|declined/, 'Tolak'],
  [/(di)?lulus(kan)?|approved/, 'Lulus'],
];
const LEVEL_WORDS = [
  [/kebangsaan|national/, 'Kebangsaan'], [/negeri|state/, 'Negeri'], [/daerah|district/, 'Daerah'],
  [/bahagian|division/, 'Bahagian'], [/kawasan|area/, 'Kawasan'], [/lokaliti|locality|local/, 'Lokaliti'],
];
const STOP = new Set(('yang sudah masih telah sedang di ke dan atau dengan untuk peringkat pertubuhan pertubuhan2 status semua senarai ' +
  'cari tunjuk berapa mana ada the a an that which who were was are is be been with of in at for level levels organisation ' +
  'organisations organization organizations org orgs all show find list still already any whose status statuses').split(' '));

const words = s => s.toLowerCase().match(/[\p{L}\p{N}-]+/gu) || [];

// Every word of `phrase` starts a word of the organisation name ("maj bel" works; "national" doesn't match "international").
function nameMatches(name, phrase) {
  const nw = words(name);
  return words(phrase).every(w => nw.some(n => n.startsWith(w)));
}

// Returns { filters: {no, nama, status, peringkat}, needsAI, leftover }.
function parseQuery(q, orgs) {
  const filters = { no: '', nama: '', status: '', peringkat: '' };
  let text = ' ' + q.toLowerCase().trim() + ' ';
  const no = text.match(/\bpppm-?\s?(\d{1,5})\b/);
  if (no) { filters.no = 'PPPM-' + no[1].padStart(5, '0'); text = text.replace(no[0], ' '); }
  for (const [re, status] of STATUS_WORDS) {
    const m = text.match(new RegExp('\\b(' + re.source + ')\\b'));
    if (m) { filters.status = status; text = text.replace(m[0], ' '); break; }
  }
  const rest = words(text).filter(w => !STOP.has(w));
  const anyName = phrase => orgs.some(o => nameMatches(o.nama, phrase));
  // Prefer reading the words as part of a name ("majlis belia negeri pahang"); only then take level words out.
  if (!rest.length || anyName(rest.join(' '))) {
    filters.nama = rest.join(' ').toUpperCase();
    return { filters, needsAI: false, leftover: '' };
  }
  const left = [];
  for (const w of rest) {
    const lvl = LEVEL_WORDS.find(([re]) => new RegExp('^(' + re.source + ')$').test(w));
    if (lvl && !filters.peringkat) filters.peringkat = lvl[1]; else left.push(w);
  }
  if (!left.length || anyName(left.join(' '))) {
    filters.nama = left.join(' ').toUpperCase();
    return { filters, needsAI: false, leftover: '' };
  }
  return { filters, needsAI: true, leftover: left.join(' ') };
}

// Apply filters to the organisation list.
function applyFilters(orgs, f) {
  return orgs.filter(p =>
    (!f.no || p.no.toLowerCase().includes(f.no.toLowerCase())) &&
    (!f.nama || nameMatches(p.nama, f.nama)) &&
    (!f.jenis || p.jenis === f.jenis) && (!f.status || p.status === f.status) && (!f.peringkat || p.peringkat === f.peringkat));
}

// For an empty result: what you'd get by dropping each active filter, best first.
function relaxations(orgs, f) {
  return Object.keys(f).filter(k => f[k])
    .map(k => ({ drop: k, count: applyFilters(orgs, { ...f, [k]: '' }).length }))
    .filter(r => r.count > 0).sort((a, b) => b.count - a.count);
}

if (typeof module !== 'undefined') module.exports = { parseQuery, applyFilters, relaxations, nameMatches };
