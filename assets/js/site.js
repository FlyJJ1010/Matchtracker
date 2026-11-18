// match-tracker.nl – gedeelde scripts (geen tracking, geen advertenties).
document.addEventListener('DOMContentLoaded', () => {
  // Jaartal in de footer
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  // Apparaatdetectie op de homepage
  const btnAndroid = document.getElementById('btn-android');
  const btnIos = document.getElementById('btn-ios');
  if (!btnAndroid || !btnIos) return;
  const deviceTitle = document.getElementById('device-title');
  const iosInstructions = document.getElementById('ios-instructions');

  const ua = navigator.userAgent || '';
  const isAndroid = /android/i.test(ua);
  // iPadOS meldt zich als Mac; herken die aan het aanraakscherm.
  const isIOS = /iPad|iPhone|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);

  if (isAndroid) {
    deviceTitle.textContent = 'MatchTracker voor Android';
    btnIos.classList.add('btn-inactive');
    btnAndroid.classList.add('ring-2', 'ring-emerald-500', 'ring-offset-2', 'ring-offset-slate-900');
    iosInstructions.classList.add('hidden');
  } else if (isIOS) {
    deviceTitle.textContent = 'MatchTracker voor iPhone en iPad';
    btnAndroid.classList.add('btn-inactive');
    btnIos.classList.remove('bg-slate-800');
    btnIos.classList.add('bg-gradient-to-r', 'from-sky-600', 'to-blue-600', 'border-sky-500/50',
      'ring-2', 'ring-sky-500', 'ring-offset-2', 'ring-offset-slate-900');
  }
  // Op desktop blijven beide knoppen gelijkwaardig zichtbaar.
});
