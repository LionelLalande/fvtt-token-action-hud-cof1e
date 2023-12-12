import { MODULES, REQUIRED_CORE_MODULE_VERSION } from '../constants';
import { initActionHandler } from '../ActionHandler';
import { initRollHandler } from '../RollHandler';
import { initSystemManager } from '../SystemManager';
import { initUtils } from '../Utils';
import { initDefaults } from '../defaults';

export const TokenActionHudCoreApiReady = {
  listen: function () {
    let SystemManagerType: typeof SystemManager | unknown = null;

    Hooks.once('tokenActionHudCoreApiReady', (coreModule: TokenActionHudCoreModule): void => {
      console.debug('COF-TAH Debug | TokenActionHUDCore | Initialize types.');
      const UtilsType = initUtils(coreModule);
      const ActionHandlerType = initActionHandler(coreModule, UtilsType);
      const RollHandlerType = initRollHandler(coreModule);
      const DEFAULTS = initDefaults(coreModule);
      SystemManagerType = initSystemManager(
        coreModule,
        <typeof ActionHandler>ActionHandlerType,
        <typeof RollHandler>RollHandlerType,
        UtilsType,
        DEFAULTS,
      );
    });

    Hooks.once('tokenActionHudCoreApiReady', async (): Promise<void> => {
      console.debug('COF-TAH Debug | TokenActionHUDCore | Initialize module.');
      const module = <Module>game.modules.get(MODULES.TokenActionHUD.COF.ID);
      (<TokenActionHudModule>module).api = {
        requiredCoreModuleVersion: REQUIRED_CORE_MODULE_VERSION,
        SystemManager: <typeof SystemManager>SystemManagerType,
      };

      Hooks.call('tokenActionHudSystemReady', module);
    });

    Hooks.once('tokenActionHudSystemReady', (): void => {
      console.debug('COF-TAH Debug | TokenActionHUDCore | Ready.');
    });
  },
};
