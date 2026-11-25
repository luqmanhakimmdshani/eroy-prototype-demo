// Shared header/nav/footer injected into every page.
document.getElementById('header').innerHTML = `
<div class="banner"><span>Sistem Pendaftaran Pertubuhan Belia</span></div>
<nav class="navbar navbar-inverse">
  <div class="container-fluid">
    <div class="navbar-header">
      <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#nav"><span class="icon-bar"></span><span class="icon-bar"></span><span class="icon-bar"></span></button>
    </div>
    <div class="collapse navbar-collapse" id="nav">
      <ul class="nav navbar-nav">
        <li><a href="index.html"><span class="glyphicon glyphicon-link"></span> Log Masuk</a></li>
        <li><a href="daftar.html"><span class="glyphicon glyphicon-user"></span> Daftar Pengguna</a></li>
        <li><a href="lupa.html"><span class="glyphicon glyphicon-off"></span> Lupa Katalaluan</a></li>
        <li class="dropdown">
          <a href="#" class="dropdown-toggle" data-toggle="dropdown"><span class="glyphicon glyphicon-search"></span> Carian<span class="caret"></span></a>
          <ul class="dropdown-menu">
            <li><a href="carian.html">Carian Umum</a></li>
            <li><a href="setiausaha.html">Permohonan Baru</a></li>
            <li><a href="semak.html">Semak Status Permohonan</a></li>
          </ul>
        </li>
        <li class="dropdown">
          <a href="#" class="dropdown-toggle" data-toggle="dropdown"><span class="glyphicon glyphicon-book"></span> Panduan<span class="caret"></span></a>
          <ul class="dropdown-menu">
            <li><a href="layak.html">Semak Kelayakan</a></li>
            <li><a href="dokumen.html">Semakan Dokumen</a></li>
            <li><a href="faq.html">Soalan Lazim (FAQ)</a></li>
          </ul>
        </li>
      </ul>
      <ul class="nav navbar-nav navbar-right">
        <li><a href="#" id="lang-toggle" data-no-i18n role="button" aria-label="Tukar bahasa / Switch language"><span class="glyphicon glyphicon-globe"></span> <b class="lang-ms">BM</b> | <b class="lang-en">EN</b></a></li>
      </ul>
    </div>
  </div>
</nav>`;
document.getElementById('footer').innerHTML = `© ${new Date().getFullYear()} <span>Pejabat Pendaftar Pertubuhan Belia.</span> <small>(Prototaip tempatan)</small>`;

// Hide CSS fallback title once the real banner image loads.
{  // block-scoped so page scripts can use their own names
  const banner = new Image();
  banner.onload = () => document.querySelector('.banner').classList.add('has-img');
  banner.src = 'assets/banner.png';
}

// "Papar Katalaluan" toggles: checkbox with data-target="#id".
document.addEventListener('change', e => {
  const t = e.target.dataset.target;
  if (t) document.querySelector(t).type = e.target.checked ? 'text' : 'password';
});

// Prototype forms never submit anywhere.
document.addEventListener('submit', e => {
  if (e.target.dataset.live || e.defaultPrevented) return;
  e.preventDefault();
  const msg = e.target.querySelector('.form-msg');
  if (msg) msg.innerHTML = '<div class="alert alert-info">Prototaip sahaja — tiada data dihantar.</div>';
});
