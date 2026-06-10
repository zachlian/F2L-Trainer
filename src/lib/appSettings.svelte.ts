import { loadFromLocalStorage, saveToLocalStorage } from './utils/localStorage';
import { browser } from '$app/environment';

const SETTINGS_KEY = 'appSettings';

interface AppSettings {
  trainAddAuf: boolean;
  crossColor: string[];
  frontColor: string[];
  trainSideSelection: { left: boolean; right: boolean };
  tempoScale: number;
}

const defaults: AppSettings = {
  trainAddAuf: true,
  crossColor: ['white'],
  frontColor: ['red'],
  trainSideSelection: { left: true, right: true },
  tempoScale: 1,
};

const persisted = browser ? loadFromLocalStorage<Partial<AppSettings>>(SETTINGS_KEY) : null;

export const appSettings: AppSettings = $state({ ...defaults, ...(persisted ?? {}) });

if (browser) {
  $effect.root(() => {
    $effect(() => {
      saveToLocalStorage(SETTINGS_KEY, { ...appSettings });
    });
  });
}
