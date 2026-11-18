// Webvervanger voor @capacitor/core (alleen in de webbuild, zie vite.web.config.mjs).
// Op het web is er geen native laag: de app-code kiest dan zelf haar browserpad
// (localStorage, WebAudio, navigator.share, download).
const noop = () => Promise.resolve(undefined);
const listener = () => Promise.resolve({ remove: noop });

/** Plugin-object waarvan elke methode niets doet (wordt op het web nooit echt aangeroepen). */
export function createInertPlugin() {
  return new Proxy({}, {
    get: (_t, prop) => (prop === 'addListener' ? listener : prop === 'then' ? undefined : noop),
  });
}

export const Capacitor = {
  isNativePlatform: () => false,
  getPlatform: () => 'web',
  isPluginAvailable: () => false,
};

export function registerPlugin() {
  return createInertPlugin();
}

export class WebPlugin {}
