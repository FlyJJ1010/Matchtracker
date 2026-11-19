// match-tracker.nl – gedeelde scripts (geen tracking, geen advertenties).

// Zet op true zodra MatchTracker publiek in Google Play staat. Dan wordt de Play-knop overal een
// echte link (homepage en /start/) en op Android op /start/ de hoofdknop.
const PLAY_LIVE = false;
const PLAY_URL = 'https://play.google.com/store/apps/details?id=nl.matchtracker.app';

// Apparaat: 'ios' | 'android' | 'desktop'. iPadOS meldt zich als Mac; herken die aan het aanraakscherm.
const MT_DEVICE = (() => {
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'android';
  if (/iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  return 'desktop';
})();

// Direct op <html>, zodat pagina's die dit script in de <head> laden (zoals /start/) niet verspringen.
// CSS: [data-show~="ios|android|desktop"] en [data-play="live|soon"] (zie _build/input.css).
document.documentElement.dataset.device = MT_DEVICE;
document.documentElement.classList.toggle('play-live', PLAY_LIVE);

document.addEventListener('DOMContentLoaded', () => {
  // Jaartal in de footer
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  // Apparaatdetectie op de homepage
  const btnAndroid = document.getElementById('btn-android');
  const btnIos = document.getElementById('btn-ios');
  if (!btnAndroid || !btnIos) return;
  const deviceTitle = document.getElementById('device-title');
  const iosInstructions = document.getElementById('ios-instructions');

  if (PLAY_LIVE) {
    // "Binnenkort op Google Play" wordt een echte link.
    const link = document.createElement('a');
    link.href = PLAY_URL;
    link.id = 'btn-android';
    link.className = btnAndroid.className.replace('cursor-default select-none', 'transition-all active:scale-95');
    link.innerHTML = btnAndroid.innerHTML.replace('Binnenkort op Google Play', 'Download in Google Play');
    btnAndroid.replaceWith(link);
  }
  const android = document.getElementById('btn-android');

  if (MT_DEVICE === 'android') {
    deviceTitle.textContent = 'MatchTracker voor Android';
    btnIos.classList.add('btn-inactive');
    android.classList.add('ring-2', 'ring-emerald-500', 'ring-offset-2', 'ring-offset-slate-900');
  } else if (MT_DEVICE === 'ios') {
    deviceTitle.textContent = 'MatchTracker voor iPhone en iPad';
    android.classList.add('btn-inactive');
    btnIos.classList.remove('bg-slate-800');
    btnIos.classList.add('bg-gradient-to-r', 'from-sky-600', 'to-blue-600', 'border-sky-500/50',
      'ring-2', 'ring-sky-500', 'ring-offset-2', 'ring-offset-slate-900');
    // Installatie-uitleg alleen op iPhone/iPad (staat standaard verborgen).
    iosInstructions.classList.remove('hidden');
  }
  // Op desktop blijven beide knoppen gelijkwaardig zichtbaar, zonder iPhone-uitleg.
});
