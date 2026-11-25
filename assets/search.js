// One-box search: understand a plain query locally, including things the filter form can't express
// (status groups, exclusions, either/or names, time at the current stage, spelling slips).
// Only words we can't place go to the AI. Pure functions, no DOM.
// ponytail: keyword lists, not NLP; anything they don't cover falls through to the AI route.

const PENDING = ['Dalam Proses Semakan', 'Kuiri Pendaftaran', 'Menunggu Pembayaran'];
const DECIDED = ['Lulus', 'Kelulusan Bersyarat', 'Dibenarkan Menubuhkan Cawangan', 'Tolak'];
const GROUPS = [  // checked before single statuses
  [/(masih\s+)?dalam\s+proses(?!\s+semakan)|masih\s+diproses|belum\s+selesai|belum\s+(di)?putus(kan)?|pending|in\s+progress|outstanding|not\s+(yet\s+)?decided/, PENDING, ['Masih dalam proses', 'Still in progress']],
  [/sudah\s+(di)?putus(kan)?|telah\s+(di)?putus(kan)?|ada\s+keputusan|selesai|decided|completed|finali[sz]ed/, DECIDED, ['Sudah ada keputusan', 'Decided']],
];
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
const NEGATE = '(?:bukan|tidak|tak|selain|kecuali|not|except|excluding|other\\s+than)\\s+(?:yang\\s+|daripada\\s+|those\\s+)?';
const TIME = /(?:lebih|melebihi|lebih\s+daripada|more\s+than|over|longer\s+than|exceeding|>)\s*(\d+|se|a|an|one)?\s*(hari|days?|minggu|weeks?|bulan|months?)/;
const UNIT = { hari: 1, day: 1, days: 1, minggu: 7, week: 7, weeks: 7, bulan: 30, month: 30, months: 30 };
const OR_WORDS = new Set(['atau', 'or']);
const STOP = new Set(('yang sudah masih telah sedang di ke dan dengan untuk peringkat pertubuhan status semua senarai ' +
  'cari tunjuk berapa mana ada lama tersangkut terperap tertangguh ' +
  'the a an that which who were was are is be been with of in at for level levels organisation ' +
  'organisations organization organizations org orgs all show find list still already any whose statuses ' +
  'stuck waiting been have has for since').split(' '));

const words = s => s.toLowerCase().match(/[\p{L}\p{N}-]+/gu) || [];

function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return d[a.length][b.length];
}

// A query word matches a name word if it starts it ("maj" -> MAJLIS), or - when fuzzy - is one slip away
// (two for long words): "bela" -> BELIA, "majlsi" -> MAJLIS. "national" never matches "international".
function wordMatches(w, n, fuzzy) {
  if (n.startsWith(w)) return true;
  if (!fuzzy || w.length < 4) return false;
  const allow = w.length >= 8 ? 2 : 1;
  return editDistance(w, n) <= allow || editDistance(w, n.slice(0, w.length)) <= allow;
}
function nameMatches(name, phrase, fuzzy = true) {
  const nw = words(name);
  return words(phrase).every(w => nw.some(n => wordMatches(w, n, fuzzy)));
}

const emptyFilters = () => ({ no: '', nama: '', namaAny: [], jenis: '', status: '', statusIn: [], statusInLabel: null, statusNot: [], peringkat: '', minDays: 0 });

// Returns { filters, needsAI, leftover }.
function parseQuery(q, orgs) {
  const f = emptyFilters();
  let text = ' ' + q.toLowerCase().replace(/[.,;!?]/g, ' , ').trim() + ' ';
  const take = m => { text = text.replace(m[0], ' '); };

  const no = text.match(/\bpppm-?\s?(\d{1,5})\b/);
  if (no) { f.no = 'PPPM-' + no[1].padStart(5, '0'); take(no); }

  const time = text.match(TIME);
  if (time) { const n = /^\d+$/.test(time[1] || '') ? Number(time[1]) : 1; f.minDays = n * UNIT[time[2]]; take(time); }

  // Exclusions first ("bukan lulus", "not pending"), then groups, then single statuses.
  for (const [re, list] of GROUPS) {
    const m = text.match(new RegExp('\\b' + NEGATE + '(?:' + re.source + ')\\b'));
    if (m) { f.statusNot.push(...list); take(m); }
  }
  for (const [re, status] of STATUS_WORDS) {
    const m = text.match(new RegExp('\\b' + NEGATE + '(?:' + re.source + ')\\b'));
    if (m) { f.statusNot.push(status); take(m); }
  }
  for (const [re, list, label] of GROUPS) {
    const m = text.match(new RegExp('\\b(?:' + re.source + ')\\b'));
    if (m) { f.statusIn = list; f.statusInLabel = label; take(m); break; }
  }
  if (!f.statusIn.length) {
    for (const [re, status] of STATUS_WORDS) {
      const m = text.match(new RegExp('\\b(?:' + re.source + ')\\b'));
      if (m) { f.status = status; take(m); break; }
    }
  }

  // Name words, possibly "X atau Y" / "X or Y". Read words as part of a name first; only then take out level words.
  const tokens = words(text.replace(/,/g, ' atau ')).filter(w => !STOP.has(w));
  const anyName = phrase => orgs.some(o => nameMatches(o.nama, phrase));
  const phrases = toks => toks.join(' ').split(/\b(?:atau|or)\b/).map(s => s.trim()).filter(Boolean);
  const fits = toks => phrases(toks).every(anyName);
  const setNames = toks => {
    const ps = phrases(toks).map(s => s.toUpperCase());
    if (ps.length > 1) f.namaAny = ps; else f.nama = ps[0] || '';
  };
  const hadOr = tokens.some(w => OR_WORDS.has(w));
  const plain = tokens.filter(w => !OR_WORDS.has(w) || hadOr);
  if (!plain.filter(w => !OR_WORDS.has(w)).length || fits(plain)) { setNames(plain); return { filters: f, needsAI: false, leftover: '' }; }
  const left = [];
  for (const w of plain) {
    const lvl = LEVEL_WORDS.find(([re]) => new RegExp('^(' + re.source + ')$').test(w));
    if (lvl && !f.peringkat) f.peringkat = lvl[1]; else left.push(w);
  }
  if (!left.filter(w => !OR_WORDS.has(w)).length || fits(left)) { setNames(left); return { filters: f, needsAI: false, leftover: '' }; }
  return { filters: f, needsAI: true, leftover: left.filter(w => !OR_WORDS.has(w)).join(' ') };
}

// Apply filters. daysOf(p) gives whole days at the current stage (data.js: daysAtStage).
function applyFilters(orgs, f, { fuzzy = true, daysOf = globalThis.daysAtStage } = {}) {
  return orgs.filter(p =>
    (!f.no || p.no.toLowerCase().includes(f.no.toLowerCase())) &&
    (!f.nama || nameMatches(p.nama, f.nama, fuzzy)) &&
    (!f.namaAny?.length || f.namaAny.some(n => nameMatches(p.nama, n, fuzzy))) &&
    (!f.jenis || p.jenis === f.jenis) &&
    (!f.status || p.status === f.status) &&
    (!f.statusIn?.length || f.statusIn.includes(p.status)) &&
    (!f.statusNot?.length || !f.statusNot.includes(p.status)) &&
    (!f.peringkat || p.peringkat === f.peringkat) &&
    // Time at the current stage only means something while the application is still in progress.
    (!f.minDays || (PENDING.includes(p.status) && daysOf(p) > f.minDays)));
}

const isActive = (f, k) => (Array.isArray(f[k]) ? f[k].length > 0 : !!f[k]) && k !== 'statusInLabel';
const cleared = (f, k) => ({ ...f, [k]: Array.isArray(f[k]) ? [] : k === 'minDays' ? 0 : '', ...(k === 'statusIn' ? { statusInLabel: null } : {}) });

// For an empty result: what you'd get by dropping each active filter, best first.
function relaxations(orgs, f, opts) {
  return Object.keys(f).filter(k => isActive(f, k))
    .map(k => ({ drop: k, count: applyFilters(orgs, cleared(f, k), opts).length }))
    .filter(r => r.count > 0).sort((a, b) => b.count - a.count);
}

if (typeof module !== 'undefined') module.exports = { parseQuery, applyFilters, relaxations, nameMatches, emptyFilters, isActive, cleared, PENDING, DECIDED };
