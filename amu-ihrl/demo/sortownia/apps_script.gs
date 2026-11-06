/**
 * IHRL 2026/27: „Sortownia AI Act” (9.11.2026) — głosy studentów (samodzielny projekt Google Apps Script, bez arkusza).
 * Wdrożenie: script.google.com → Nowy projekt → wklej ten plik → Wdróż → Nowe wdrożenie → Aplikacja internetowa
 *   (wykonuj jako: ja; dostęp: każdy). Adres /exec wpisz w index.html (stała API).
 * Dane: właściwości skryptu (PropertiesService), jeden wpis na osobę: {przykład: kategoria}. Bez imion: osoba to losowy
 * identyfikator z przeglądarki. Ostatni wybór danej osoby przy danym przykładzie zastępuje poprzedni.
 * Przed zajęciami: uruchom wyczyscWszystko() z edytora.
 */
const KOD = 'ihrl26';   // kod zajęć (ochrona przed przypadkowymi wpisami, nie zabezpieczenie)
const PRZYKLADY = ['twarze', 'stadion', 'nagranie', 'egzamin', 'cv', 'czatbot', 'kierowca', 'punkty', 'telefon', 'sedzia'];
const KATEGORIE = ['Z', 'W', 'P', 'R'];
const out_ = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);

function doPost(e) {
  let p;
  try { p = JSON.parse(e.postData.contents); } catch (x) { return out_({ok: false, err: 'format'}); }
  if (p.kod !== KOD) return out_({ok: false, err: 'kod'});
  if (typeof p.voter !== 'string' || !/^[a-z0-9]{4,40}$/i.test(p.voter)) return out_({ok: false, err: 'voter'});
  if (PRZYKLADY.indexOf(p.przyklad) < 0) return out_({ok: false, err: 'przyklad'});
  if (KATEGORIE.indexOf(p.kat) < 0) return out_({ok: false, err: 'kat'});
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const props = PropertiesService.getScriptProperties(), key = 'g_' + p.voter;
    let moje = {};
    try { moje = JSON.parse(props.getProperty(key) || '{}'); } catch (x) {}
    moje[p.przyklad] = p.kat;
    props.setProperty(key, JSON.stringify(moje));
    return out_({ok: true});
  } finally { lock.releaseLock(); }
}

function doGet(e) {
  if ((e.parameter || {}).a !== 'stan') return out_({ok: true, info: 'IHRL sortownia AI Act: głosy'});
  const g = {}, all = PropertiesService.getScriptProperties().getProperties();
  PRZYKLADY.forEach(id => g[id] = {Z: 0, W: 0, P: 0, R: 0});
  let osoby = 0;
  Object.keys(all).forEach(k => {
    if (k.indexOf('g_') !== 0) return;
    let m = {};
    try { m = JSON.parse(all[k]); } catch (x) { return; }
    osoby++;
    Object.keys(m).forEach(id => { if (g[id] && KATEGORIE.indexOf(m[id]) >= 0) g[id][m[id]]++; });
  });
  return out_({ok: true, czas: new Date(), glosy: g, osoby: osoby});
}

// Pomocnicze (uruchamiane ręcznie z edytora): czyści głosy przed zajęciami
function wyczyscWszystko() {
  PropertiesService.getScriptProperties().deleteAllProperties();
}
