// match-tracker.nl – gedeelde scripts (geen tracking, geen advertenties).
// Bewust eenvoudige syntaxis (ES5: geen ?., ??, replaceAll, arrow functions of NodeList.forEach), zodat
// ook oudere browsers alles uitvoeren. Elk onderdeel staat apart in try/catch: een fout in één onderdeel
// laat de rest van de pagina werken. Zonder script blijft de veilige standaard in de HTML staan.

// Zet op true zodra MatchTracker publiek in Google Play staat. Dan wordt de Play-knop overal een
// echte link (homepage en /start/) en op Android op /start/ de hoofdknop.
var PLAY_LIVE = false;
var PLAY_URL = 'https://play.google.com/store/apps/details?id=nl.matchtracker.app';

function mtTry(name, fn) {
  try {
    fn();
  } catch (e) {
    if (window.console && console.error) console.error('site.js (' + name + '):', e);
  }
}

function mtEach(list, fn) {
  Array.prototype.forEach.call(list, fn);
}

// Apparaat: 'ios' | 'android' | 'desktop'. iPadOS meldt zich als Mac; herken die aan het aanraakscherm.
function mtDetectDevice() {
  var ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'android';
  if (/iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  return 'desktop';
}

var MT_DEVICE = 'desktop';
mtTry('apparaat', function () {
  MT_DEVICE = mtDetectDevice();
  document.documentElement.setAttribute('data-device', MT_DEVICE);
});

// /start/: toon alleen de variant voor dit apparaat. Pas als die klaarstaat, gaat de neutrale knop weg.
function mtSetupStart() {
  var root = document.getElementById('start-choice');
  if (!root) return;
  var variant = root.querySelector('[data-variant="' + MT_DEVICE + '"]');
  var fallback = root.querySelector('[data-variant="default"]');
  if (!variant || !fallback) return;
  var want = PLAY_LIVE ? 'live' : 'soon';
  mtEach(variant.querySelectorAll('[data-play]'), function (el) {
    el.hidden = el.getAttribute('data-play') !== want;
  });
  variant.hidden = false;
  fallback.hidden = true;
}

// Homepage: knoppen per apparaat en de iPhone-uitleg.
function mtSetupHome() {
  var btnAndroid = document.getElementById('btn-android');
  var btnIos = document.getElementById('btn-ios');
  if (!btnAndroid || !btnIos) return;
  var deviceTitle = document.getElementById('device-title');
  var iosInstructions = document.getElementById('ios-instructions');

  if (PLAY_LIVE) {
    // "Binnenkort op Google Play" wordt een echte link.
    var link = document.createElement('a');
    link.href = PLAY_URL;
    link.id = 'btn-android';
    link.className = btnAndroid.className.replace('cursor-default select-none', 'transition-all active:scale-95');
    link.innerHTML = btnAndroid.innerHTML.replace('Binnenkort op Google Play', 'Download in Google Play');
    btnAndroid.parentNode.replaceChild(link, btnAndroid);
    btnAndroid = link;
  }

  if (MT_DEVICE === 'android') {
    if (deviceTitle) deviceTitle.textContent = 'MatchTracker voor Android';
    btnIos.classList.add('btn-inactive');
    btnAndroid.classList.add('ring-2', 'ring-emerald-500', 'ring-offset-2', 'ring-offset-slate-900');
  } else if (MT_DEVICE === 'ios') {
    if (deviceTitle) deviceTitle.textContent = 'MatchTracker voor iPhone en iPad';
    btnAndroid.classList.add('btn-inactive');
    btnIos.classList.remove('bg-slate-800');
    btnIos.classList.add('bg-gradient-to-r', 'from-sky-600', 'to-blue-600', 'border-sky-500/50',
      'ring-2', 'ring-sky-500', 'ring-offset-2', 'ring-offset-slate-900');
    // Installatie-uitleg alleen op iPhone/iPad (staat standaard verborgen met het hidden-attribuut).
    if (iosInstructions) iosInstructions.hidden = false;
  }
  // Op de computer blijven beide knoppen gelijkwaardig zichtbaar, zonder iPhone-uitleg.
}

function mtInit() {
  mtTry('jaartal', function () {
    var year = String(new Date().getFullYear());
    mtEach(document.querySelectorAll('[data-year]'), function (el) { el.textContent = year; });
  });
  mtTry('start', mtSetupStart);
  mtTry('homepage', mtSetupHome);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mtInit);
else mtInit();
