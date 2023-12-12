// <reference Path="../../@types/token-action-hud-core/index.d.ts" />

import { MODULES } from './constants';

export function initUtils(coreModule: TokenActionHudCoreModule) {
  return class Utils extends coreModule.api.Utils {
    /**
     * Get setting value
     * @param {string} key The key
     * @param {string} defaultValue The default value
     * @returns The setting value
     */
    static override getSetting(key: string, defaultValue: string | null = null) {
      let value: unknown = defaultValue ?? null;
      try {
        value = game.settings.get(MODULES.TokenActionHUD.COF.ID, key);
      } catch {
        coreModule.api.Logger.debug(`Setting '${key}' not found`);
      }
      return value;
    }

    /**
     * Set setting value
     * @param {string} key The key
     * @param {string} value The value
     */
    static override async setSetting(key: string, value: string | null) {
      try {
        value = await game.settings.set(MODULES.TokenActionHUD.COF.ID, key, value);
        coreModule.api.Logger.debug(`Setting '${key}' set to '${value}'`);
      } catch {
        coreModule.api.Logger.debug(`Setting '${key}' not found`);
      }
    }
  };
}
