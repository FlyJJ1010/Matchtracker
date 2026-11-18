// Webvervanger voor native Capacitor-plugins: Preferences, LocalNotifications, Browser, KeepAwake.
// De app roept deze alleen aan als Capacitor.isNativePlatform() true is; op het web dus nooit.
import { createInertPlugin } from './capacitor-core.js';

export const Preferences = createInertPlugin();
export const LocalNotifications = createInertPlugin();
export const Browser = createInertPlugin();
export const KeepAwake = createInertPlugin();
