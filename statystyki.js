/* Statystyki użycia stron z zajęciami i wystąpieniami Łukasza Szoszkiewicza: GoatCounter, bez cookies.
 *
 * KONTO: lszoszk.goatcounter.com, to samo co HUDOC Researcher, UNHRDB, UHRI+ i hrc-voting. Ścieżki zaczynają się
 * od nazwy repozytorium (/teaching-materials/…, /talks/…), więc nie mieszają się z narzędziami.
 *
 * CO WYSYŁA: odsłonę strony (ścieżka pliku bez ?zapytania i #kotwicy, tytuł strony, strona odsyłająca bez
 * zapytania, rozmiar ekranu) oraz zdarzenia:
 *   …/slajd/12          pierwsze wejście na slajd w tej wizycie (prezentacje, w których bieżący slajd ma .slide.active),
 *   …/klik/<etykieta>   przycisk albo element z data-stat="<etykieta>" (napis na przycisku, najwyżej 40 znaków),
 *   …/link/<cel>        link: na zewnątrz sama domena, wewnątrz ścieżka strony,
 *   …/trasa/<a>/<b>     trasa aplikacji w kotwicy (#/organizacja), tylko gdy skrypt ma atrybut data-trasy,
 *   …/czas/5-min        czas z otwartą, widoczną kartą: 1, 5, 15 i 45 minut (demo w ramce: tylko gdy ramka jest otwarta),
 *   …/otwarta           strona podmieniła cały dokument i wczytała skrypt jeszcze raz (Kraina po wpisaniu kodu).
 * CZEGO NIE WYSYŁA: treści pól formularzy (skrypt ich nie czyta), kodów dostępu, zapytań z adresu, identyfikatora
 * osoby. Nic nie zapisuje w przeglądarce, więc dwóch wizyt nie da się połączyć.
 * KIEDY DZIAŁA: tylko na lszoszk.github.io (kopia lokalna, localhost i fork nic nie wysyłają) i nie przy
 * Do Not Track ani Global Privacy Control. Bez zewnętrznych skryptów: sam piksel GoatCounter (/count).
 * WIZYTY AUTORA SIĘ NIE LICZĄ: dowolna strona z dopiskiem #toggle-goatcounter ustawia w tej przeglądarce znacznik
 * skipgc (ten sam, którego używa count.js GoatCounter w narzędziach, więc wyłącza liczenie na całym
 * lszoszk.github.io); ponowne otwarcie z tym dopiskiem włącza liczenie z powrotem. Raz na przeglądarkę i urządzenie.
 *
 * UŻYCIE: <script src="../statystyki.js" defer></script>; własne zdarzenie: window.lszStat('nazwa').
 * Ten sam plik leży w katalogu głównym repozytoriów teaching-materials i talks.
 */
(function () {
  'use strict';
  var me = document.currentScript;
  var trasy = !!(me && me.hasAttribute('data-trasy'));
  if (window.__lszStat) { window.__lszStat.znowu(trasy); return; }
  window.lszStat = function () {};
  window.__lszStat = { znowu: function () {} };
  if (location.hostname !== 'lszoszk.github.io') return;
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true) return;
  var pomin = false;
  try {
    if (location.hash === '#toggle-goatcounter') {
      if (localStorage.getItem('skipgc') === 't') { localStorage.removeItem('skipgc'); alert('Statystyki: ta przeglądarka znów jest liczona.'); }
      else { localStorage.setItem('skipgc', 't'); alert('Statystyki: ta przeglądarka nie jest już liczona (cały lszoszk.github.io).'); }
    }
    pomin = localStorage.getItem('skipgc') === 't';
  } catch (e) {}
  if (pomin) return;

  var ENDPOINT = 'https://lszoszk.goatcounter.com/count';
  var sciezka = function (p) { return p.replace(/index\.html?$/, '').replace(/\/+$/, '') || '/'; };
  var base = sciezka(location.pathname);
  var czysc = function (t, n) { return String(t || '').replace(/\s+/g, ' ').replace(/[?#&]/g, '').trim().slice(0, n); };
  var ostatnie = {};

  function wyslij(p, t, ev, ref) {
    var q = 'p=' + encodeURIComponent(p) + '&t=' + encodeURIComponent(t || p) + (ev ? '&e=true' : '') +
      '&r=' + encodeURIComponent(ref || '') +
      '&s=' + encodeURIComponent([screen.width, screen.height, window.devicePixelRatio || 1].join(',')) +
      '&rnd=' + Math.random().toString(36).slice(2);
    new Image().src = ENDPOINT + '?' + q;
  }
  function zdarzenie(nazwa, tytul) {
    var p = base + '/' + nazwa, teraz = Date.now();
    if (ostatnie[p] && teraz - ostatnie[p] < 800) return;   // podwójne kliknięcie to jedno zdarzenie
    ostatnie[p] = teraz;
    wyslij(p, tytul || nazwa, true, '');
  }
  window.lszStat = function (nazwa) { if (nazwa) zdarzenie('klik/' + czysc(nazwa, 40)); };

  // odsłona: strona odsyłająca bez zapytania i kotwicy
  var ref = '';
  try { if (document.referrer) { var r = new URL(document.referrer); ref = r.origin + r.pathname; } } catch (e) {}
  var odslona = function () { wyslij(base, czysc(document.title, 120) || base, false, ref); };
  // ramka wczytana zawczasu (okno W prezentacji jest ukryte, ramka ma 0×0 px): odsłona dopiero po otwarciu
  var ramka = window.top !== window.self;
  if (ramka && !innerWidth) {
    var czekaj = function () {
      if (!innerWidth) return;
      try { if (window.frameElement && new URL(frameElement.src).pathname !== location.pathname) return; } catch (e) {}   // ramka właśnie przechodzi na inne demo
      removeEventListener('resize', czekaj); odslona();
    };
    addEventListener('resize', czekaj);
  } else odslona();

  function klik(e) {
    var el = e.target && e.target.closest && e.target.closest('[data-stat],a[href],button,summary,[role="button"],[data-live],[data-open]');
    if (!el) return;
    var a = el.closest('a[href]'), et;
    if (el.hasAttribute('data-stat')) et = 'klik/' + czysc(el.getAttribute('data-stat'), 40);
    else if (a && !el.hasAttribute('data-live') && !el.hasAttribute('data-open') && (a.getAttribute('href') || '#').charAt(0) !== '#') {
      var h = a.getAttribute('href'), u;
      if (/^(mailto|tel):/i.test(h)) { zdarzenie('link/' + h.split(':')[0].toLowerCase()); return; }   // bez adresu
      try { u = new URL(h, location.href); } catch (x) { return; }
      et = u.hostname === location.hostname ? 'link' + sciezka(u.pathname) : 'link/' + u.hostname;
    } else et = 'klik/' + czysc(el.getAttribute('data-live-title') || el.getAttribute('aria-label') || el.textContent || el.getAttribute('title'), 40);
    if (/\/$/.test(et)) return;   // bez etykiety
    zdarzenie(et);
  }

  var widziane = {};
  function slajdy() {
    var S = [].slice.call(document.querySelectorAll('.slide'));
    if (S.length < 2 || !window.MutationObserver) return;
    var sprawdz = function (el) {
      if (!el.classList.contains('active')) return;
      var i = S.indexOf(el);
      if (i < 0 || widziane[i]) return;
      widziane[i] = 1;
      var h = el.getAttribute('data-title') || (el.querySelector('h1,h2,h3') || {}).textContent || '';
      zdarzenie('slajd/' + (i + 1), 'Slajd ' + (i + 1) + (h ? ': ' + czysc(h, 80) : ''));
    };
    var mo = new MutationObserver(function (ms) { ms.forEach(function (m) { sprawdz(m.target); }); });
    S.forEach(function (el) { mo.observe(el, { attributes: true, attributeFilter: ['class'] }); sprawdz(el); });
  }

  // trasa z kotwicy: tylko kolejne człony z liter, cyfr, _ i -, najwyżej 4; dalej nic nie idzie
  var ostTrasa = null;
  function trasa() {
    var s = location.hash.replace(/^#\/?/, '').split('/'), ok = [];
    for (var i = 0; i < s.length && ok.length < 4; i++) { if (!/^[\w-]{1,40}$/.test(s[i])) break; ok.push(s[i]); }
    var t = ok.join('/') || 'start';
    if (t === ostTrasa) return;
    ostTrasa = t;
    zdarzenie('trasa/' + t);
  }

  // czas z widoczną kartą
  var sekundy = 0, progi = [1, 5, 15, 45], nr = 0;
  setInterval(function () {
    if (document.visibilityState !== 'visible' || (ramka && !innerWidth)) return;
    sekundy += 15;
    while (nr < progi.length && sekundy >= progi[nr] * 60) { zdarzenie('czas/' + progi[nr] + '-min'); nr++; }
  }, 15000);

  function podepnij(t) {
    document.addEventListener('click', klik, true);
    slajdy();
    if (t) { window.addEventListener('hashchange', trasa); trasa(); }
  }
  window.__lszStat.znowu = function (t) { widziane = {}; ostTrasa = null; zdarzenie('otwarta'); podepnij(t); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { podepnij(trasy); });
  else podepnij(trasy);
})();
