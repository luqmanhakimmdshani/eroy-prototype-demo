// Mock data. Names are fictional; reg numbers, levels and statuses are invented.
const PERTUBUHAN = [
  ['KELAB BELIA CONTOH MELATI', 'Daerah', 'Lulus'],
  ['KELAB BELIA CONTOH SERI INDAH', 'Daerah', 'Lulus'],
  ['KELAB BELIA CONTOH BUKIT CAHAYA', 'Kawasan', 'Dalam Proses Semakan'],
  ['KELAB BELIA CONTOH DESA JAYA', 'Daerah', 'Menunggu Pembayaran'],
  ['GERAKAN BELIA CONTOH NASIONAL', 'Kebangsaan', 'Dibenarkan Menubuhkan Cawangan'],
  ['MAJLIS BELIA CONTOH WILAYAH', 'Negeri', 'Lulus'],
  ['PERTUBUHAN BELIA CONTOH BERSATU', 'Kebangsaan', 'Kelulusan Bersyarat'],
  ['MAJLIS BELIA CONTOH NEGERI A', 'Negeri', 'Lulus'],
  ['PERSATUAN BELIA CONTOH HARAPAN', 'Kebangsaan', 'Kuiri Pendaftaran'],
  ['MAJLIS BELIA CONTOH NEGERI B', 'Negeri', 'Lulus'],
  ['MAJLIS BELIA CONTOH NEGERI C', 'Negeri', 'Lulus'],
  ['MAJLIS BELIA CONTOH NEGERI D', 'Negeri', 'Tolak'],
  ['GABUNGAN PELAJAR CONTOH', 'Kebangsaan', 'Lulus'],
  ['MAJLIS BELIA CONTOH KEBANGSAAN', 'Kebangsaan', 'Lulus'],
  ['MAJLIS BELIA CONTOH NEGERI E', 'Negeri', 'Lulus'],
  ['PERSATUAN USAHAWAN MUDA CONTOH', 'Kebangsaan', 'Dalam Proses Semakan'],
  ['PERSATUAN KELAB BELIA CONTOH', 'Kebangsaan', 'Lulus'],
].map(([nama, peringkat, status], i) => ({
  no: `PPPM-${String(1001 + i).padStart(5, '0')}`, nama, jenis: 'Tunggal', peringkat, status,
}));

// Application timeline per organisation, in the order the user manual describes (Bab 5.7-5.9, 6.1).
// Dates are invented but deterministic per organisation.
const FINAL = ['Lulus', 'Tolak', 'Kelulusan Bersyarat', 'Dibenarkan Menubuhkan Cawangan'];
function timeline(p) {
  const steps = ['Permohonan Dihantar (Setiausaha)', 'Pengesahan Pengerusi', 'Menunggu Pembayaran', 'Dalam Proses Semakan'];
  if (p.status === 'Kuiri Pendaftaran') steps.push('Kuiri Pendaftaran');
  steps.push(FINAL.includes(p.status) ? p.status : 'Keputusan');
  const reached = FINAL.includes(p.status) ? steps.length - 1 : steps.indexOf(p.status);
  // Recent, deterministic dates: the current stage started 1-45 days ago, earlier stages ~9 days apart.
  const DAY = 86400000, today = new Date(new Date().toDateString()).getTime();
  const start = today - (reached * 9 + 1 + (Number(p.no.slice(-3)) * 13) % 45) * DAY;
  return steps.map((label, i) => ({
    label,
    state: i < reached || (i === reached && FINAL.includes(p.status)) ? 'done' : i === reached ? 'current' : 'todo',
    date: i <= reached ? new Date(start + i * 9 * DAY) : null,
  }));
}

// Whole days since the application reached its current stage.
function daysAtStage(p) {
  const cur = timeline(p).filter(s => s.date).pop();
  return Math.round((Date.now() - cur.date.getTime()) / 86400000);
}
