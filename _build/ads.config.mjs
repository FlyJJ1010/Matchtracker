// EÉN schakelaar voor alle advertenties (Google AdSense) op match-tracker.nl:
//  - website: homepage (home-1, home-2) en Uitleg & FAQ (uitleg-1)   -> _build/site-ads.mjs
//  - webapp /app/: banner onderin en rustblok                         -> _build/webapp/vite.web.config.mjs
//
// ADS_ENABLED = false: geen AdSense-script, geen blokken, geen verzoeken naar Google.
// Aanzetten (na goedkeuring door AdSense): zet hieronder true en bouw site én webapp opnieuw:
//   npm run build:ads && npm run build:stamp     (website)
//   node _build/webapp/build-webapp.mjs           (webapp)
// Zie _build/README.md.
export const ADS_ENABLED = false;

export const ADSENSE_CLIENT = 'ca-pub-9906906182484323';

export const AD_SLOTS = {
  // Webapp
  banner: '9961331988', // 320x50, vaste balk onderin
  break: '6039940831', // 300x250, alleen in de rust (isEligibleBreak)
  // Website: responsieve displayblokken (data-ad-format="auto", full-width-responsive)
  'home-1': '5770659745', // matchtracker-home-1
  'home-2': '6892169723', // matchtracker-home-2
  'uitleg-1': '3553679611', // matchtracker-uitleg-1
};
